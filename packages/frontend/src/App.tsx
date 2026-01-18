import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

// Criamos um tipo para definir o formato da Pizza
interface Pizza {
    id: string;
    nome: string;
    precoM: number;
}

function App() {
    const [pizzas, setPizzas] = useState<Pizza[]>([])
    const [status, setStatus] = useState('Carregando...')

    useEffect(() => {
        // 1. Testa a saúde
        axios.get('http://localhost:3333/api/health')
            .then(res => setStatus(res.data.status))
            .catch(err => {
                console.error(err);
                setStatus('Offline 🔴');
            });

        // 2. Busca as pizzas
        axios.get('http://localhost:3333/api/pizzas')
            .then(res => {
                setPizzas(res.data)
            })
            .catch(console.error)
    }, [])

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1>🍕 Pizzaria Full Stack</h1>
                <small>Status do Servidor: {status}</small>
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {pizzas.map(pizza => (
                    <div key={pizza.id} style={{
                        border: '1px solid #ddd',
                        padding: '1rem',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <strong>{pizza.nome}</strong>
                        <span>R$ {pizza.precoM.toFixed(2)}</span>
                    </div>
                ))}

                {pizzas.length === 0 && <p>Nenhuma pizza encontrada...</p>}
            </div>
        </div>
    )
}

export default App
