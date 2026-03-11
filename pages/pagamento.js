/*******************************************************************************
 * Objetivo: Arquivo responsável por toda a lógica do site de pagamento da rifa.
 * Data: 04/03/2026 (quarta-feira)
 * Autores:
    - Gustavo Vidal de Abreu
    - Kauan Alves Pereira
    - Kayque Brenno Ferreira Almeida
    - Pyetro Ferreira de Souza
 * Versão: 3.0
********************************************************************************/

'use strict'

const NUMEROS = JSON.parse(localStorage.getItem('numeros')) || []
const NOME = localStorage.getItem('nome') || ''
const TURMA = localStorage.getItem('turma') || ''
const CREATED_AT = Number(localStorage.getItem('createdAt') || 0)

if (!CREATED_AT || NUMEROS.length === 0) {
    window.location.href = "../index.html"
}

const TOTAL = (NUMEROS.length * 3.5).toFixed(2)

document.getElementById('numConfirmado').innerText = NUMEROS.join(', ')
document.getElementById('nomeConfirmado').innerText = NOME
document.getElementById('turmaConfirmada').innerText = TURMA
document.getElementById('valorFinal').innerText = TOTAL

const mensagem = `Olá, Manuela! Comprei os números ${NUMEROS.join(', ')}.
Nome: ${NOME}
Turma: ${TURMA}
Total: R$ ${TOTAL}`

document.getElementById('btnWhatsapp').onclick = function () {
    const URL = `https://wa.me/5511946168749?text=${encodeURIComponent(mensagem)}`
    window.location.href = URL
}

const TIMER = document.getElementById("timer")

const TEMPO_EXPIRACAO = 30 * 60 * 1000
const EXPIRES_AT = CREATED_AT + TEMPO_EXPIRACAO

let intervalo

function atualizarTempo() {
    const AGORA = Date.now()
    const RESTANTE = EXPIRES_AT - AGORA

    if (RESTANTE <= 0) {
        clearInterval(intervalo)

        TIMER.innerText = "Reserva expirada"

        localStorage.removeItem('numeros')
        localStorage.removeItem('nome')
        localStorage.removeItem('turma')
        localStorage.removeItem('createdAt')

        setTimeout(() => {
            window.location.href = "../index.html"
        }, 3000)

        return
    }

    const MINUTOS = Math.floor(RESTANTE / 60000)
    const SEGUNDOS = Math.floor((RESTANTE % 60000) / 1000)

    TIMER.innerText = `${String(MINUTOS).padStart(2, '0')}:${String(SEGUNDOS).padStart(2, '0')}`
}

intervalo = setInterval(atualizarTempo, 1000)
atualizarTempo()

function showToast(msg, type = 'success', duration = 3000) {
    let toast = document.createElement('div')

    toast.className = `toast ${type}`
    toast.innerText = msg

    document.body.appendChild(toast)

    setTimeout(() => toast.classList.add('show'), 100)

    setTimeout(() => {
        toast.classList.remove('show')
        setTimeout(() => document.body.removeChild(toast), 300)
    }, duration)
}

function copiarPix() {
    const CHAVE_PIX = document.getElementById('pixKey').innerText
    const BOTAO = document.getElementById('btnPix')

    navigator.clipboard.writeText(CHAVE_PIX)
        .then(() => {
            showToast('Chave Pix copiada!', 'success')

            BOTAO.innerText = 'Copiado ✓'

            setTimeout(() => {
                BOTAO.innerText = 'Copiar'
            }, 2000)
        })
        .catch(() => {
            showToast('Erro ao copiar chave Pix', 'error')
        })
}

window.copiarPix = copiarPix