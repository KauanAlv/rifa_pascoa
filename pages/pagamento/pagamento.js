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

let numeros = []

try {
    const data = JSON.parse(localStorage.getItem('numeros'))
    if (Array.isArray(data)) numeros = data
} catch { }

const nome = localStorage.getItem('nome') || ''
const turma = localStorage.getItem('turma') || ''
const createdAt = Number(localStorage.getItem('createdAt') || 0)

const TEMPO_EXPIRACAO = 30 * 60 * 1000

if (!createdAt || numeros.length === 0 || Date.now() > createdAt + TEMPO_EXPIRACAO) {
    window.location.href = "../../index.html"
}

const total = (numeros.length * 3.5).toFixed(2)

document.getElementById('numConfirmado').textContent = numeros.join(', ')
document.getElementById('nomeConfirmado').textContent = nome
document.getElementById('turmaConfirmada').textContent = turma
document.getElementById('valorFinal').textContent = total

const nomeDestino = "Manuela"

const mensagem = `Olá, ${nomeDestino}! Comprei os números ${numeros.join(', ')}.
Nome: ${nome}
Turma: ${turma}
Total: R$ ${total}`

function entrarWhatsApp() {
    const url = `https://wa.me/5511946168749?text=${encodeURIComponent(mensagem)}`
    window.location.href = url
}

const timer = document.getElementById("timer")

const expiresAt = createdAt + TEMPO_EXPIRACAO

let intervalo

function atualizarTempo() {
    const agora = Date.now()
    const restante = expiresAt - agora

    if (restante <= 0) {
        if (intervalo) clearInterval(intervalo)

        timer.textContent = "Reserva expirada"

        localStorage.removeItem('numeros')
        localStorage.removeItem('nome')
        localStorage.removeItem('turma')
        localStorage.removeItem('createdAt')

        setTimeout(() => {
            window.location.href = "../../index.html"
        }, 3000)

        return
    }

    const minutos = Math.floor(restante / 60000)
    const segundos = Math.floor((restante % 60000) / 1000)

    timer.textContent = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
}

intervalo = setInterval(atualizarTempo, 1000)
atualizarTempo()

function showToast(msg, type = 'success', duration = 3000) {
    let toast = document.createElement('div')

    toast.className = `toast ${type}`
    toast.textContent = msg

    document.body.appendChild(toast)

    setTimeout(() => toast.classList.add('show'), 100)

    setTimeout(() => {
        toast.classList.remove('show')
        setTimeout(() => document.body.removeChild(toast), 300)
    }, duration)
}

const pixKeyEl = document.getElementById('pixKey')
const botao = document.getElementById('btnPix')

let timeoutId = null

function copiarPix() {
    const chave = pixKeyEl.textContent?.trim()

    // Validação da chave
    if (!chave) {
        showToast('Chave Pix inválida', 'error')
        return
    }

    // Verifica suporte ao clipboard
    if (!navigator.clipboard) {
        showToast('Seu navegador não suporta cópia automática', 'error')
        return
    }

    navigator.clipboard.writeText(chave)
        .then(() => {
            showToast('Chave Pix copiada!', 'success')

            botao.textContent = 'Copiado ✓'
            botao.disabled = true

            // Evita múltiplos timeouts
            if (timeoutId) clearTimeout(timeoutId)

            timeoutId = setTimeout(() => {
                botao.textContent = 'Copiar'
                botao.disabled = false
                timeoutId = null
            }, 2000)
        })
        .catch(() => {
            showToast('Erro ao copiar chave Pix', 'error')
        })
}

window.copiarPix = copiarPix