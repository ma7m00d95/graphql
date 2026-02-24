import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import '../styles/App.css'
import { request, gql } from 'graphql-request';
import bgImage from '../assets/bg.png'
const API_URL_LOGIN = `https://learn.reboot01.com/api/auth/signin`
const API_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

// Define the Login Mutation
const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
    }
  }
`;

function App({ onLogin }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [username, setUser] = useState("")
  const [password, setPassword] = useState("")


  const submit = (e) => {
    e.preventDefault();
    setError('');

    const credentials = btoa(`${username}:${password}`);

    fetch('https://learn.reboot01.com/api/auth/signin', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Login failed');
        return response.json();
      })
      .then(token => {
        onLogin(token);

        // 1. Save the token
        localStorage.setItem('username', username);

        // 2. Immediately fetch the User ID using the new token
        return fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `query { user { id login } }`
          })
        });
      })
      .then(res => res.json())
      .then(result => {
        if (result.data && result.data.user.length > 0) {
          const userId = result.data.user[0].id;

          // 3. Store the ID
          localStorage.setItem('userId', userId);
          navigate('/dashboard');
        }
      })
      .catch(err => {
        setError('Invalid username or password');
        console.error(err);
      });

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
