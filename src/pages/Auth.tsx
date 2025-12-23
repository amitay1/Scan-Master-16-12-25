import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { signUpSchema, signInSchema } from '@/lib/validationSchemas';
import { Loader2, ArrowLeft, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate input
    const validation = signUpSchema.safeParse({ email, password, fullName });
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: {
            full_name: validation.data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created successfully! You can now sign in.');
        setIsSignUp(false);
        setPassword('');
        setFullName('');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate input
    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Dev mode bypass DISABLED for production
      // To re-enable (NOT RECOMMENDED): uncomment the following
      /*
      if (validation.data.email === '0' && validation.data.password === '0' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        localStorage.setItem('dev_mode', 'true');
        toast.success('Signed in successfully! (Development Mode)');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
        setLoading(false);
        return;
      }
      */

      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Signed in successfully!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const welcomeText = "Welcome to Scan Master";
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const letterVariants = {
    hidden: { 
      opacity: 0, 
      y: 50, 
      scale: 0.5,
      rotate: -180 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 200,
      },
    },
  };

  const scanLineVariants = {
    animate: {
      x: ["0%", "100%"],
      opacity: [0, 1, 1, 0],
      transition: {
        x: {
          duration: 3,
          repeat: Infinity,
          ease: "linear" as const,
        },
        opacity: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Animated Welcome Text */}
        <motion.div
          className="mb-8 text-center relative"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div className="relative inline-block">
            {/* Glowing background effect */}
            <motion.div
              className="absolute inset-0 blur-2xl"
              animate={{
                background: [
                  "radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)",
                  "radial-gradient(circle, rgba(147,51,234,0.5) 0%, transparent 70%)",
                  "radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            />
            
            {/* Main text with letter animation */}
            <h1 className="text-4xl md:text-5xl font-bold relative">
              {welcomeText.split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className="inline-block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                  style={{
                    textShadow: "0 0 20px rgba(147,51,234,0.5)",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </h1>

            {/* Scanning line effect */}
            <motion.div
              className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <motion.div
                className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
                variants={scanLineVariants}
                animate="animate"
                style={{
                  boxShadow: "0 0 15px 5px rgba(6,182,212,0.8)",
                }}
              />
            </motion.div>
          </motion.div>

          {/* Icon animation */}
          <motion.div
            className="mt-4 flex justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 1.5,
              type: "spring" as const,
              stiffness: 200,
              damping: 15,
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear" as const,
              }}
            >
              <ScanLine className="h-8 w-8 text-cyan-400" />
            </motion.div>
          </motion.div>
        </motion.div>

        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Create an account to save and manage your inspection technique sheets'
                : 'Sign in to access your inspection technique sheets'}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName" data-testid="input-fullname"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="inspector@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className={errors.email ? 'border-destructive' : ''}
                data-testid="input-email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" data-testid="input-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" data-testid="submit-button" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              disabled={loading}
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

