import { signUpAction, signInAction } from './src/app/auth/actions.js';

async function run() {
  console.log("Testing sign up...");
  const formData = new FormData();
  formData.append('email', 'test12345@example.com');
  formData.append('password', 'SuperSecurePass123!');
  formData.append('displayName', 'Test User');

  const res = await signUpAction(formData);
  console.log("Signup Result:", res);
}

run().catch(console.error);
