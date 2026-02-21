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

function App() {
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
      // 1. Save the token
      localStorage.setItem('token', token);
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
        console.log("Logged in User ID:", userId);
        
        navigate('/dashboard');
      }
    })
    .catch(err => {
      setError('Invalid username or password');
      console.error(err);
    });

  };


  return (
    <div className='App-global'>
      <label>Login To Reboot</label>

      <label>Username: </label>
      <input value={username} onChange={(e) => { setUser(e.target.value) }} ></input>

      <label >Password: </label>
      <input type='password' value={password} onChange={(e) => { setPassword(e.target.value) }} ></input>

      <button onClick={submit} >Login</button>
    </div>

  )
}

export default App
