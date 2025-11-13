#!/bin/bash

# Google Cloud Platform Deployment Script

set -e

echo "======================================"
echo "Deploying to Google Cloud Platform"
echo "======================================"

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-scan-master-prod}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-scan-master}"

# Step 1: Authenticate
echo "1. Authenticating with GCP..."
gcloud auth login

# Step 2: Set project
echo "2. Setting project..."
gcloud config set project $PROJECT_ID

# Step 3: Enable required APIs
echo "3. Enabling required APIs..."
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# Step 4: Build the application
echo "4. Building application..."
npm run build

# Choose deployment method
echo ""
echo "Choose deployment method:"
echo "1) App Engine (Simple, Auto-scaling)"
echo "2) Cloud Run (Containerized, Serverless)"
echo "3) Compute Engine (Full VM control)"
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo "Deploying to App Engine..."
    gcloud app deploy app.yaml --quiet
    echo "App deployed to: https://$PROJECT_ID.appspot.com"
    ;;
    
  2)
    echo "Building Docker image..."
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME
    
    echo "Deploying to Cloud Run..."
    gcloud run deploy $SERVICE_NAME \
      --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
      --platform managed \
      --region $REGION \
      --allow-unauthenticated \
      --port 5000 \
      --memory 1Gi \
      --max-instances 10 \
      --min-instances 1
      
    echo "Getting service URL..."
    gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
    ;;
    
  3)
    echo "Creating Compute Engine instance..."
    gcloud compute instances create $SERVICE_NAME \
      --zone=$REGION-a \
      --machine-type=e2-medium \
      --image-family=ubuntu-2004-lts \
      --image-project=ubuntu-os-cloud \
      --boot-disk-size=20GB \
      --tags=http-server,https-server
    
    echo "Setting up firewall rules..."
    gcloud compute firewall-rules create allow-http \
      --allow tcp:80,tcp:443,tcp:5000 \
      --source-ranges 0.0.0.0/0 \
      --target-tags http-server
    
    echo "Instance created. SSH to complete setup:"
    echo "gcloud compute ssh $SERVICE_NAME --zone=$REGION-a"
    ;;
esac

echo ""
echo "Deployment complete!"