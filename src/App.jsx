import { useState } from "react"
import reactLogo from "./assets/react.svg"
import viteLogo from "/vite.svg"
import "./App.css"

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">

      {/* Logos */}
      <div className="flex items-center gap-6 mb-6">
        <a href="https://vite.dev" target="_blank">
          <img
            src={viteLogo}
            className="w-20 hover:drop-shadow-xl transition"
            alt="Vite logo"
          />
        </a>
        <a href="https://react.dev" target="_blank">
          <img
            src={reactLogo}
            className="w-20 hover:drop-shadow-xl transition animate-spin-slow"
            alt="React logo"
          />
        </a>
      </div>

      {/* Título */}
      <h1 className="text-5xl font-bold text-blue-600 mb-8">
        Vite + React + Tailwind
      </h1>

      {/* Card */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md text-center">
        <button
          onClick={() => setCount(count + 1)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition mb-4"
        >
          count is {count}
        </button>

        <p className="text-gray-700">
          Edit <code className="font-bold">src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <p className="mt-6 text-gray-500">
        Click on the Vite and React logos to learn more
      </p>

      <h1 className="text-3xl font-bold underline mt-10">
        Hello world!
      </h1>
    </div>
  )
}

