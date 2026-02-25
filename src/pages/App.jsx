import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import '../styles/App.css'
import { request, gql } from 'graphql-request';
import bgImage from '../assets/bg.png'
const API_URL_LOGIN = `https://learn.reboot01.com/api/auth/signin`
const API_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';


function App({ onLogin }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [username, setUser] = useState("")
  const [password, setPassword] = useState("")


const submit = async (e) => {
  e.preventDefault();
  setError('');

  try {
    const credentials = btoa(`${username}:${password}`);

    // 1. Login
    const loginRes = await fetch(API_URL_LOGIN, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!loginRes.ok) throw new Error('Login failed');

    const token = await loginRes.json();

    // Save token immediately
    localStorage.setItem('token', token);
 
    // 2. Fetch user ID
    const userRes = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query { user { id login } }`,
      }),
    });

    const result = await userRes.json();

    if (result.data?.user?.length > 0) {
      const userId = result.data.user[0].id;

      localStorage.setItem('userId', userId);

      navigate('/dashboard');
    }
    onLogin(token); // 🔥 IMPORTANT


  } catch (err) {
    setError('Invalid username or password');
    console.error(err);
  }
};


  return (

    <div className="flex h-screen w-full bg-base-100">
      {/* Left Side: Image Container */}
      <div className="hidden w-1/2 lg:block">
        <img
          src={bgImage}
          alt="Company Logo"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Right Side: Form Container */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <form className="fieldset bg-base-200 border-base-300 rounded-box w-full max-w-sm border p-8 shadow-2xl"
        onSubmit={submit} >
          {error && <p className="mb-4 text-center text-error font-medium">{error}</p>}

          <legend className="fieldset-legend mb-6 text-4xl font-black tracking-tight">Login</legend>

          <div className="space-y-4">
            <div>
              <label className="label text-sm font-bold uppercase tracking-wider text-neutral-500">Email</label>
              <input
                className="input input-bordered w-full text-lg bg-base-300 focus:input-primary"
                placeholder="Enter your email/username"
                value={username}
                onChange={(e) => { setUser(e.target.value) }}
              />
            </div>

            <div>
              <label className="label text-sm font-bold uppercase tracking-wider text-neutral-500">Password</label>
              <input
                type="password"
                className="input input-bordered w-full text-lg bg-base-300 focus:input-primary"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value) }}
              />
            </div>

            <button
              className="btn btn-neutral btn-block mt-6 text-xl"
              type="submit" 
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>

  )
}

export default App
