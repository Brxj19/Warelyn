import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function validate(values) {
  if (!values.email || !values.password) {
    return 'Email and password are required.';
  }
  if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await login(values);
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (err) {
      setError(err.payload?.error?.message ?? 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field) {
    return (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  }

  return (
    <Card className="w-full max-w-md">
      <CardBody className="p-8">
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-warelyn-primary text-base font-bold text-white">WI</div>
          <h1 className="text-2xl font-bold tracking-tight text-warelyn-text">Sign in to Warelyn</h1>
          <p className="mt-2 text-sm text-warelyn-muted">Inventory that moves with your business.</p>
        </div>

        {error ? <ErrorState description={error} title="Sign in failed" /> : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input autoComplete="email" id="email" label="Email" onChange={updateField('email')} placeholder="you@example.com" type="email" value={values.email} />
          <Input autoComplete="current-password" id="password" label="Password" onChange={updateField('password')} placeholder="Password" type="password" value={values.password} />
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-warelyn-muted">
          New to Warelyn?{' '}
          <Link className="font-semibold text-warelyn-primary hover:text-blue-900" to="/register">
            Register your company
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
