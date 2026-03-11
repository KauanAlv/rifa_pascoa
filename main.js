/***************************************************************************
 * Objetivo: Arquivo responsável por toda a lógica do site de venda da rifa.
 * Data: 04/03/2026 (quarta-feira)
 * Autores:
    - Gustavo Vidal de Abreu
    - Kauan Alves Pereira
    - Kayque Brenno Ferreira Almeida
    - Pyetro Ferreira de Souza
 * Versão: 2.8
***************************************************************************/

'use strict'

// Importações Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import {
    getFirestore,
    collection,
    onSnapshot,
    doc,
    runTransaction,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'

// Configurações do Firebase
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyByikN6_CXfiJnb1_0ppP60oBQxN8zVxYA',
    authDomain: 'site-para-rifa-de-pascoa-25745.firebaseapp.com',
    projectId: 'site-para-rifa-de-pascoa-25745',
    storageBucket: 'site-para-rifa-de-pascoa-25745.firebasestorage.app',
    messagingSenderId: '1004843167683',
    appId: '1:1004843167683:web:93211e8925926723c3d776'
}

const APP = initializeApp(FIREBASE_CONFIG)
const DATABASE = getFirestore(APP)

// DOM
const NUMBERS_CONTAINER = document.getElementById('numbers')
const COUNTER = document.getElementById('counter')
const SUMMARY = document.getElementById('summary')
const BUY_BUTTON = document.getElementById('buyBtn')

// CAMPO NOME
const CAMPO_NOME = document.getElementById('name')

// FORÇAR NOME EM MAIÚSCULO
CAMPO_NOME.addEventListener('input', function () {
    let nome = this.value

    nome = nome.replace(/[^A-Za-zÀ-ÿ\s]/g, '')
    nome = nome.toUpperCase()

    this.value = nome
})

// CONFIG
const TEMPO_EXPIRACAO = 30 * 60 * 1000

const STATUS = {
    RESERVADO: "reservado",
    VENDIDO: "vendido"
}

// ESTADO
let soldNumbers = new Set()
let reservedNumbers = new Set()
let selectedNumbers = []
let comprando = false

// CALCULAR EXPIRAÇÃO
function calcularExpiracao() {
    const AGORA = new Date()

    const INICIO = new Date()
    INICIO.setHours(7, 30, 0, 0)

    const FIM = new Date()
    FIM.setHours(22, 0, 0, 0)

    if (AGORA < INICIO) {
        return INICIO.getTime() + TEMPO_EXPIRACAO
    }

    if (AGORA >= FIM) {
        const PROXIMO_DIA = new Date(INICIO)
        PROXIMO_DIA.setDate(PROXIMO_DIA.getDate() + 1)

        return PROXIMO_DIA.getTime() + TEMPO_EXPIRACAO
    }

    const EXPIRACAO = new Date(AGORA)
    EXPIRACAO.setMinutes(EXPIRACAO.getMinutes() + 30)

    if (EXPIRACAO > FIM) {
        const PROXIMO_DIA = new Date(INICIO)
        PROXIMO_DIA.setDate(PROXIMO_DIA.getDate() + 1)

        return PROXIMO_DIA.getTime() + TEMPO_EXPIRACAO
    }

    return EXPIRACAO.getTime()
}

// BARRA DE PROGRESSO
function atualizarBarra(ocupados, total) {
    const PORCENTAGEM = Math.round((ocupados / total) * 100);

    document.getElementById("progresso").style.width = PORCENTAGEM + "%";
    document.getElementById("porcentagem").innerText = PORCENTAGEM + "% Ocupados";
}

// CONTADOR REGRESSIVO
function iniciarContador() {
    const DATA_SORTEIO = new Date("2026-04-03T00:00:00").getTime()

    const INTERVALO = setInterval(() => {
        const AGORA = new Date().getTime()

        const DISTANCIA = DATA_SORTEIO - AGORA

        const DIAS = Math.floor(DISTANCIA / (1000 * 60 * 60 * 24))
        const HORAS = Math.floor((DISTANCIA % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const MINUTOS = Math.floor((DISTANCIA % (1000 * 60 * 60)) / (1000 * 60))
        const SEGUNDOS = Math.floor((DISTANCIA % (1000 * 60)) / 1000)

        document.getElementById("days").innerText = DIAS
        document.getElementById("hours").innerText = HORAS
        document.getElementById("minutes").innerText = MINUTOS
        document.getElementById("seconds").innerText = SEGUNDOS

        if (DISTANCIA < 0) {
            clearInterval(INTERVALO)
            document.getElementById("countdown").innerHTML = "🎉 SORTEIO ENCERRADO!"
            animacaoSorteio()
        }
    }, 1000)
}

iniciarContador()

// CONFETES
function confete() {
    for (let i = 0; i < 120; i++) {
        const CONFETE = document.createElement("div")
        CONFETE.classList.add("confete")

        const CORES = [
            "#ff0000",
            "#ffd700",
            "#22c55e",
            "#3b82f6",
            "#ff69b4"
        ]

        CONFETE.style.background = CORES[Math.floor(Math.random() * CORES.length)]

        CONFETE.style.left = Math.random() * 100 + "vw"

        CONFETE.style.animationDuration = (Math.random() * 3 + 3) + "s"

        CONFETE.style.width = (Math.random() * 8 + 4) + "px"
        CONFETE.style.height = CONFETE.style.width

        document.body.appendChild(CONFETE)

        setTimeout(() => {
            CONFETE.remove()
        }, 6000)
    }
}

// ANIMAÇÃO SORTEIO
function animacaoSorteio() {
    const NUMEROS = document.querySelectorAll(".number")

    let velocidade = 50
    let rodadas = NUMEROS.length * 3
    let atual = 0

    const intervalo = setInterval(() => {
        NUMEROS.forEach(n => {
            n.style.background = ""
            n.style.color = ""
        })

        NUMEROS[atual].style.background = "#ffd700"
        NUMEROS[atual].style.color = "#000"

        atual++

        if (atual >= NUMEROS.length) atual = 0

        rodadas--

        if (rodadas <= 0) {
            clearInterval(intervalo)

            const VENCEDOR = Math.floor(Math.random() * NUMEROS.length)

            NUMEROS[VENCEDOR].style.background = "#22c55e"
            NUMEROS[VENCEDOR].style.color = "#fff"

            confete()
        }
    }, velocidade)
}

// CARREGAR NÚMEROS
function loadNumbers() {
    onSnapshot(collection(DATABASE, 'rifa'), async (querySnapshot) => {
        if (comprando) return
        soldNumbers = new Set()
        reservedNumbers = new Set()

        const AGORA = Date.now()

        for (const docSnap of querySnapshot.docs) {
            const DATA = docSnap.data()
            const STATUS = (DATA.status || "").toLowerCase()
            const NUMERO = Number(DATA.number)

            if (STATUS === STATUS.RESERVADO) {
                if (DATA.expiresAt && AGORA > DATA.expiresAt) {
                    // REMOVE RESERVA EXPIRADA
                    await deleteDoc(doc(DATABASE, 'rifa', NUMERO.toString()))
                    continue
                }

                reservedNumbers.add(NUMERO)
            } else if (STATUS === STATUS.VENDIDO) {
                soldNumbers.add(NUMERO)
            }
        }

        createNumbers()
        updateCounter()
    })
}

// CRIAR NÚMEROS
function createNumbers() {
    NUMBERS_CONTAINER.innerHTML = ''

    const FRAGMENT = document.createDocumentFragment()

    for (let i = 1; i <= 150; i++) {
        const DIV = document.createElement('div')

        DIV.classList.add('number')
        DIV.innerText = i

        if (soldNumbers.has(i))
            DIV.classList.add('sold')
        else if (reservedNumbers.has(i))
            DIV.classList.add('reserved')

        if (selectedNumbers.includes(i)) DIV.classList.add('selected')

        DIV.addEventListener('click', () => {
            if (soldNumbers.has(i) || reservedNumbers.has(i)) {
                showToast("Esse número já está reservado ou vendido.")
                return
            }

            if (selectedNumbers.includes(i)) {
                selectedNumbers = selectedNumbers.filter(n => n !== i)
                DIV.classList.remove('selected')
            } else {
                selectedNumbers.push(i)
                DIV.classList.add('selected')
            }

            updateSummary()
        })

        FRAGMENT.appendChild(DIV)
    }

    NUMBERS_CONTAINER.appendChild(FRAGMENT)
}

// COPIAR PIX
function copiarPix() {
    const CHAVE = document.getElementById("pixKey").innerText;

    navigator.clipboard.writeText(CHAVE)
        .then(() => {
            showToast("Chave PIX copiada!");
        })
        .catch(() => {
            showToast("Erro ao copiar a chave PIX.");
        });
}

window.copiarPix = copiarPix

// RESUMO
function updateSummary() {
    if (selectedNumbers.length === 0) {
        SUMMARY.innerText = 'Nenhum número selecionado.'
        return
    }

    const TOTAL = (selectedNumbers.length * 3.5).toFixed(2)

    SUMMARY.innerHTML = `
    Números: <strong>${selectedNumbers.join(', ')}</strong><br>
    Total: <strong>R$ ${TOTAL}</strong>
    `
}

// CONTADOR
function updateCounter() {
    const VENDIDOS = soldNumbers.size
    const RESERVADOS = reservedNumbers.size
    const DISPONIVEIS = 150 - VENDIDOS - RESERVADOS

    COUNTER.innerText = `Disponíveis: ${DISPONIVEIS} | Reservados: ${RESERVADOS} | Vendidos: ${VENDIDOS}`

    const OCUPADOS = VENDIDOS + RESERVADOS
    atualizarBarra(OCUPADOS, 150)
}

// TOAST
function showToast(msg, duration = 3000) {
    let toast = document.createElement('div')

    toast.className = 'toast'
    toast.innerText = msg

    document.body.appendChild(toast)

    setTimeout(() => toast.classList.add('show'), 100)
    setTimeout(() => {
        toast.classList.remove('show')
        setTimeout(() => document.body.removeChild(toast), 300)
    }, duration)
}

// RESERVAR
BUY_BUTTON.addEventListener('click', async () => {
    const NAME = document.getElementById('name').value.trim()
    const TURMA = document.getElementById('turma').value.trim()

    if (selectedNumbers.length === 0) return showToast('Selecione um número.')

    if (!NAME) return showToast('Digite seu nome.')

    if (!TURMA) return showToast('Escolha sua turma.')

    BUY_BUTTON.disabled = true

    try {
        for (let number of selectedNumbers) {
            const REF = doc(DATABASE, 'rifa', number.toString())

            await runTransaction(DATABASE, async (transaction) => {
                const SNAP = await transaction.get(REF)

                if (SNAP.exists()) {
                    const DATA = SNAP.data()
                    const STATUS = (DATA.status || "").toLowerCase()

                    if (STATUS === STATUS.VENDIDO) throw new Error()
                    if (STATUS === STATUS.RESERVADO && Date.now() < DATA.expiresAt) throw new Error()

                    transaction.delete(REF)
                }

                transaction.set(REF, {
                    name: NAME,
                    turma: TURMA,
                    number,
                    status: STATUS.RESERVADO,
                    createdAt: Date.now(),
                    expiresAt: calcularExpiracao()
                })
            })
        }

        localStorage.setItem('numeros', JSON.stringify(selectedNumbers))
        localStorage.setItem('nome', NAME)
        localStorage.setItem('turma', TURMA)
        localStorage.setItem('createdAt', Date.now())

        comprando = true

        confete()

        setTimeout(() => {
            window.location.href = './pages/pagamento.html'
        }, 2000)
    } catch {
        showToast('Um dos números já foi reservado.')
        BUY_BUTTON.disabled = false
    }
})

// iniciar
loadNumbers()