import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';

export function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardBody className="p-8">
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-warelyn-primary text-base font-bold text-white">WI</div>
          <h1 className="text-2xl font-bold tracking-tight text-warelyn-text">Sign in to Warelyn</h1>
          <p className="mt-2 text-sm text-warelyn-muted">Authentication is a Phase 1 placeholder and is not active yet.</p>
        </div>

        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <Input disabled id="email" label="Email" placeholder="you@example.com" type="email" />
          <Input disabled id="password" label="Password" placeholder="••••••••" type="password" />
          <Button className="w-full" disabled type="submit">
            Auth coming next
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
