import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [hashContrasena, setHashContrasena] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(nombreUsuario, hashContrasena);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Credenciales inválidas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4 text-center">
          Iniciar Sesión
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Usuario</label>
            <input
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              value={hashContrasena}
              onChange={(e) => setHashContrasena(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

