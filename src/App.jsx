import { BrowserRouter, Route, Routes } from "react-router-dom"
import General from "./scenes/General"
import Auth from "./scenes/Auth"

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Auth />} />
        <Route path='/home' element={<General />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
