import { SignIn } from '@clerk/clerk-react';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 overflow-x-hidden">
      <div className="w-full max-w-md overflow-x-hidden">
        <SignIn 
          routing="path" 
          path="/login"
          signUpUrl="/signup"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-gray-900 border border-gray-800 shadow-xl',
              headerTitle: 'text-white text-2xl font-bold',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlock: 'space-y-2',
              socialButtonsBlockButton: 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white',
              formFieldLabel: 'text-gray-300',
              formFieldInput: 'bg-gray-950 border border-gray-800 text-white',
              formButton: 'bg-blue-600 hover:bg-blue-700 text-white',
              footerAction: 'text-gray-400',
              footerActionLink: 'text-blue-500 hover:text-blue-400',
            },
          }}
        />
      </div>
    </div>
  );
}
