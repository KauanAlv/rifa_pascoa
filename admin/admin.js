/***************************************************************************
 * Objetivo: Arquivo responsável por toda a lógica do painel administrativo.
 * Data: 05/03/2026 (quinta-feira)
 * Autores:
    - Gustavo Vidal de Abreu
    - Kauan Alves Pereira
    - Kayque Brenno Ferreira Almeida
    - Pyetro Ferreira de Souza
 * Versão: 4.0
****************************************************************************/

'use strict'

// Importações Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import {
    getFirestore,
    collection,
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'

// Configurações do Firebase
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyByikN6_CXfiJnb1_0ppP60oBQxN8zVxYA',
    authDomain: 'site-para-rifa-de-pascoa-25745.firebaseapp.com',
    projectId: 'site-para-rifa-de-pascoa-25745',
    storageBucket: 'site-para-rifa-de-pascoa-25745.appspot.com',
    messagingSenderId: '1004843167683',
    appId: '1:1004843167683:web:93211e8925926723c3d776'
}

// Inicialização Firebase
const APP = initializeApp(FIREBASE_CONFIG)
const DATABASE = getFirestore(APP)
const AUTH = getAuth(APP)

// Elementos DOM
const LISTA_RESERVADOS = document.getElementById('listaReservados')
const LISTA_VENDIDOS = document.getElementById('listaVendidos')
const STATS = document.getElementById('stats')
const SEARCH_INPUT = document.getElementById('searchInput')

// Variáveis globais
let reservas = []
let termoBusca = ''

// LOGIN ADMIN
async function loginAdmin() {
    const EMAIL = prompt('Digite o email do administrador:')
    const SENHA = prompt('Digite a senha do administrador:')

    try {
        await signInWithEmailAndPassword(AUTH, EMAIL, SENHA)
    } catch (error) {
        alert('Login incorreto.')
        window.location.href = '../index.html'
    }
}

// VERIFICAR AUTENTICAÇÃO
onAuthStateChanged(AUTH, (user) => {
    if (!user)
        loginAdmin()
    else
        escutarReservas()
})

// ESCUTAR RESERVAS FIREBASE
function escutarReservas() {
    onSnapshot(collection(DATABASE, 'rifa'), (snapshot) => {
        reservas = []

        snapshot.forEach((docSnap) => {
            reservas.push({
                id: docSnap.id,
                ...docSnap.data()
            })
        })

        reservas.sort((a, b) => a.number - b.number)

        renderizarReservas(reservas)
    })
}

// SISTEMA FECHADO
function sistemaFechado() {
    const AGORA = new Date()

    const HORA = AGORA.getHours()
    const MINUTO = AGORA.getMinutes()

    const MINUTOS = HORA * 60 + MINUTO

    const INICIO = 7 * 60 + 30
    const FIM = 22 * 60

    return MINUTOS < INICIO || MINUTOS >= FIM
}

// RENDERIZAR RESERVAS
function renderizarReservas(listaReservas) {
    LISTA_RESERVADOS.innerHTML = ''
    LISTA_VENDIDOS.innerHTML = ''

    let vendidos = 0
    let reservados = 0

    listaReservas.forEach((data) => {
        const STATUS = (data.status || '').toLowerCase()

        if (STATUS === 'vendido') vendidos++
        if (STATUS === 'reservado') reservados++

        let dataFormatada = '-'
        let horaFormatada = '-'

        if (data.createdAt) {
            const DATA_FIREBASE = new Date(data.createdAt)

            dataFormatada = DATA_FIREBASE.toLocaleDateString('pt-BR')
            horaFormatada = DATA_FIREBASE.toLocaleTimeString('pt-BR')
        }

        let tempoRestanteHTML = ''

        if (STATUS === 'reservado' && data.expiresAt) {
            if (sistemaFechado()) {
                tempoRestanteHTML = `
                <div class="tempo" style="color: orange; font-weight: bold;">
                Retoma às 07:30 ⏸
                <br>
                30 min após a retomada
                </div>
                <br>
                `
            } else {
                const AGORA = Date.now()
                const TEMPO_RESTANTE = data.expiresAt - AGORA

                if (TEMPO_RESTANTE > 0) {
                    const MINUTOS = Math.floor(TEMPO_RESTANTE / 60000)
                    const SEGUNDOS = Math.floor((TEMPO_RESTANTE % 60000) / 1000)

                    let cor = 'green'

                    if (TEMPO_RESTANTE < 300000)
                        cor = 'red'
                    else if (TEMPO_RESTANTE < 600000)
                        cor = 'orange'
                    

                    tempoRestanteHTML = `
                    <div class="tempo" style="color:${cor}; font-weight:bold;">
                    ⏱️ Expira em: ${MINUTOS}:${SEGUNDOS.toString().padStart(2, '0')}
                    </div>
                    <br>
                    `
                } else {
                    tempoRestanteHTML = `
                    <div class="tempo" style="color:red; font-weight:bold;">
                    ⏱️ EXPIRADO
                    </div>
                    <br>
                    `
                }
            }
        }

        const DIV = document.createElement('div')

        DIV.style.border = '1px solid #ccc'
        DIV.style.padding = '10px'
        DIV.style.marginBottom = '20px'
        DIV.style.borderRadius = '8px'

        let botoes = `
        <button onclick="cancelar('${data.id}')">Cancelar</button>
        `

        if (STATUS === 'reservado') {
            botoes = `
            <button onclick="confirmar('${data.id}')">Confirmar pagamento</button>
            <button onclick="cancelar('${data.id}')">Cancelar</button>
            `
        }

        DIV.innerHTML = `
        ${tempoRestanteHTML}
        <strong>NÚMERO:</strong> ${data.number}<br><br>
        <strong>NOME:</strong> ${data.name}<br><br>
        <strong>TURMA:</strong> ${data.turma.toUpperCase()}<br><br>
        <strong>STATUS:</strong> ${data.status.toUpperCase()}<br><br>
        <strong>DATA:</strong> ${dataFormatada}<br><br>
        <strong>HORA:</strong> ${horaFormatada}
        <br><br>
        ${botoes}
        `

        if (STATUS === 'vendido')
            LISTA_VENDIDOS.appendChild(DIV)
        else if (STATUS === 'reservado')
            LISTA_RESERVADOS.appendChild(DIV)
    })

    const DISPONIVEIS = 150 - vendidos - reservados

    STATS.innerHTML = `
    <p>Vendidos: <strong>${vendidos}</strong></p>
    <p>Reservados: <strong>${reservados}</strong></p>
    <p>Disponíveis: <strong>${DISPONIVEIS}</strong></p>
    `
}

// CONFIRMAR PAGAMENTO
window.confirmar = async function (id) {
    try {
        await updateDoc(doc(DATABASE, 'rifa', id), {
            status: 'vendido'
        })
        alert('Pagamento confirmado!')
    } catch (error) {
        console.error(error)
        alert('Erro ao confirmar pagamento.')
    }
}

// CANCELAR RESERVA
window.cancelar = async function (id) {
    const CONFIRMAR = confirm('Tem certeza que deseja cancelar esta reserva?')

    if (!CONFIRMAR) return

    try {
        await deleteDoc(doc(DATABASE, 'rifa', id))
        alert('Reserva cancelada!')
    } catch (error) {
        console.error(error)
        alert('Erro ao cancelar reserva.')
    }
}

// BUSCA
SEARCH_INPUT.addEventListener('input', () => {
    termoBusca = SEARCH_INPUT.value.toUpperCase()

    const FILTRADOS = reservas.filter((r) =>
        (r.name || '').toUpperCase().includes(termoBusca) ||
        String(r.number || '').includes(termoBusca)
    )

    renderizarReservas(FILTRADOS)
})

// TIMER GLOBAL
setInterval(() => {
    const FILTRADOS = reservas.filter((r) =>
        (r.name || '').toUpperCase().includes(termoBusca) ||
        String(r.number || '').includes(termoBusca)
    )

    renderizarReservas(FILTRADOS)
}, 1000)