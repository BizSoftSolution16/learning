'use client'
import { useState, useEffect } from "react"

export default function Home() {
  const [users, setUsers] = useState([])
  const [pnl, setPnl] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/User')
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
        console.log(users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }
  const fetchPnl = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pnl')
      const data = await res.json()
      if (data.success) {
        setPnl(data)
        console.log(pnl)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Users</h1>
      <button onClick={fetchUsers} style={{ marginBottom: '20px' }}>
        Refresh Users
      </button>
      <button onClick={fetchPnl} style={{ marginBottom: '20px' }}>
        Refresh PNL
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{user.UserID}</td>
                  <td style={{ padding: '10px' }}>{user.UserName}</td>
                  <td style={{ padding: '10px' }}>{user.EmailID}</td>
                  <td style={{ padding: '10px' }}>{user.role}</td>
                  <td style={{ padding: '10px' }}>
                    {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '10px', textAlign: 'center' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
