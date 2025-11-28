#!/bin/bash

# AWS Deployment Script

set -e

echo "======================================"
echo "Deploying to Amazon Web Services"
echo "======================================"

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
APP_NAME="${APP_NAME:-scan-master}"
STACK_NAME="${STACK_NAME:-scan-master-stack}"

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI not found. Please install it first:"
    echo "https://aws.amazon.com/cli/"
    exit 1
fi

# Step 1: Configure AWS
echo "1. Configuring AWS..."
aws configure list

# Step 2: Build application
echo "2. Building application..."
npm run build

# Choose deployment method
echo ""
echo "Choose AWS deployment method:"
echo "1) Elastic Beanstalk (Simple, Managed)"
echo "2) ECS Fargate (Containerized, Serverless)"
echo "3) Lambda + API Gateway (Pure Serverless)"
echo "4) EC2 (Full control)"
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo "Deploying to Elastic Beanstalk..."
    
    # Initialize EB if not already done
    if [ ! -d ".elasticbeanstalk" ]; then
        eb init -p node.js-18 $APP_NAME --region $AWS_REGION
    fi
    
    # Create environment if it doesn't exist
    eb create $APP_NAME-prod --instance-type t3.small || true
    
    # Set environment variables
    eb setenv NODE_ENV=production \
              DATABASE_URL=$DATABASE_URL \
              JWT_SECRET=$JWT_SECRET
    
    # Deploy
    eb deploy
    
    # Get URL
    eb open
    ;;
    
  2)
    echo "Building Docker image for ECS..."
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | \
      docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Create ECR repository if it doesn't exist
    aws ecr create-repository --repository-name $APP_NAME --region $AWS_REGION || true
    
    # Build and push Docker image
    docker build -t $APP_NAME .
    docker tag $APP_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME:latest
    
    echo "Creating ECS task definition..."
    cat > task-definition.json <<EOF
{
  "family": "$APP_NAME",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "$APP_NAME",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/$APP_NAME",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF
    
    # Register task definition
    aws ecs register-task-definition --cli-input-json file://task-definition.json
    
    echo "Creating ECS service..."
    # This would require VPC and ALB setup - simplified here
    echo "Please complete ECS service setup in AWS Console"
    ;;
    
  3)
    echo "Deploying to Lambda..."
    
    # Install serverless if not already installed
    if ! command -v serverless &> /dev/null; then
        npm install -g serverless
    fi
    
    # Deploy using serverless
    serverless deploy --stage prod --region $AWS_REGION
    ;;
    
  4)
    echo "Setting up EC2 instance..."
    
    # Create key pair if it doesn't exist
    aws ec2 create-key-pair --key-name $APP_NAME-key --query 'KeyMaterial' --output text > $APP_NAME-key.pem
    chmod 400 $APP_NAME-key.pem
    
    # Get latest Ubuntu AMI
    AMI_ID=$(aws ec2 describe-images \
      --owners 099720109477 \
      --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*" \
      --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
      --output text)
    
    # Create security group
    SG_ID=$(aws ec2 create-security-group \
      --group-name $APP_NAME-sg \
      --description "Security group for $APP_NAME" \
      --query 'GroupId' \
      --output text)
    
    # Allow HTTP, HTTPS, and app port
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 5000 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
    
    # Launch instance
    INSTANCE_ID=$(aws ec2 run-instances \
      --image-id $AMI_ID \
      --instance-type t3.medium \
      --key-name $APP_NAME-key \
      --security-group-ids $SG_ID \
      --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$APP_NAME}]" \
      --query 'Instances[0].InstanceId' \
      --output text)
    
    echo "Waiting for instance to be running..."
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    
    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
      --instance-ids $INSTANCE_ID \
      --query 'Reservations[0].Instances[0].PublicIpAddress' \
      --output text)
    
    echo ""
    echo "EC2 instance created!"
    echo "Instance ID: $INSTANCE_ID"
    echo "Public IP: $PUBLIC_IP"
    echo ""
    echo "SSH into the instance to complete setup:"
    echo "ssh -i $APP_NAME-key.pem ubuntu@$PUBLIC_IP"
    echo ""
    echo "Then run these commands:"
    echo "1. sudo apt update && sudo apt upgrade -y"
    echo "2. curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "3. sudo apt install -y nodejs git nginx"
    echo "4. git clone <your-repo>"
    echo "5. cd <repo> && npm install && npm run build"
    echo "6. sudo npm install -g pm2"
    echo "7. pm2 start npm --name scan-master -- run start"
    echo "8. pm2 save && pm2 startup"
    ;;
esac

echo ""
echo "Deployment complete!"