import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import '../styles/App.css'
import { request, gql } from 'graphql-request';

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

  const [username, setUser] = useState("malsari")
  const [password, setPassword] = useState("S@yedM1234")


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
    <div className="flex h-screen items-center justify-center">
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <legend className="fieldset-legend text-3xl font-bold ">Login</legend>

        <label className="text-3xl font-bold text-neutral">Email</label>
        <input type="email" className="input text-2xl  bg-base-300" placeholder="Email" value={username} onChange={(e) => { setUser(e.target.value) }} />

        <label className="text-3xl font-bold text-neutral">Password</label>
        <input type="password" className="input text-2xl  bg-base-300" placeholder="Password" value={password} onChange={(e) => { setPassword(e.target.value) }} />

        <button className="btn btn-neutral mt-4 text-2xl" onClick={submit}>Login</button>
      </fieldset>
    </div>

  )
}

export default App
