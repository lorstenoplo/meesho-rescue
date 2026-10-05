// Entry point. Guard catches any render error and offers a restart instead of a blank screen.
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Safety net for live demos: never leave a blank screen.
class Guard extends React.Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  componentDidCatch(err) { console.error(err) }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: '#3E0632', color: '#fff', fontFamily: 'Poppins, sans-serif' }}>
        <button onClick={() => this.setState({ err: null })} style={{ font: 'inherit', fontWeight: 700, fontSize: 18, padding: '14px 26px', borderRadius: 14, border: 0, background: '#F7A21B', color: '#3E0632', cursor: 'pointer' }}>Restart demo</button>
      </div>
    )
  }
}

createRoot(document.getElementById('root')).render(<Guard><App /></Guard>)
