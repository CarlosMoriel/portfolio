import friendImg from './assets/friend.jpg'

function App() {
  return (
    <main className="stage">
      <div
        className="backdrop"
        style={{ backgroundImage: `url(${friendImg})` }}
        aria-hidden="true"
      />
      <img className="hero" src={friendImg} alt="" />
    </main>
  )
}

export default App
