import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyByikN6_CXfiJnb1_0ppP60oBQxN8zVxYA",
    authDomain: "site-para-rifa-de-pascoa-25745.firebaseapp.com",
    projectId: "site-para-rifa-de-pascoa-25745",
    storageBucket: "site-para-rifa-de-pascoa-25745.firebasestorage.app",
    messagingSenderId: "1004843167683",
    appId: "1:1004843167683:web:93211e8925926723c3d776"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const numbersContainer = document.getElementById("numbers");
const counter = document.getElementById("counter");
const summary = document.getElementById("summary");
const buyBtn = document.getElementById("buyBtn");

let soldNumbers = [];
let selectedNumbers = [];

async function loadNumbers() {
    const querySnapshot = await getDocs(collection(db, "rifa"));
    querySnapshot.forEach(doc => {
        soldNumbers.push(doc.data().number);
    });

    createNumbers();
    updateCounter();
}

function createNumbers() {
    for (let i = 1; i <= 100; i++) {
        const div = document.createElement("div");
        div.classList.add("number");
        div.innerText = i;

        if (soldNumbers.includes(i)) div.classList.add("sold");

        div.addEventListener("click", () => {
            if (soldNumbers.includes(i)) return;

            if (selectedNumbers.includes(i)) {
                selectedNumbers = selectedNumbers.filter(n => n !== i);
                div.classList.remove("selected");
            } else {
                selectedNumbers.push(i);
                div.classList.add("selected");
            }

            updateSummary();
        });

        numbersContainer.appendChild(div);
    }
}

function updateSummary() {
    if (selectedNumbers.length === 0) {
        summary.innerText = "Nenhum número selecionado.";
        return;
    }

    const total = selectedNumbers.length * 3.5;
    summary.innerHTML =
        `Números: <strong>${selectedNumbers.join(", ")}</strong><br>
         Total: <strong>R$${total.toFixed(2)}</strong>`;
}

function updateCounter() {
    counter.innerText = `Disponíveis: ${100 - soldNumbers.length} | Vendidos: ${soldNumbers.length}`;
}
function showToast(msg, duration = 3000) {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    document.body.appendChild(toast);

    // força reflow pra animar
    setTimeout(() => toast.classList.add("show"), 100);

    // some sozinho
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => document.body.removeChild(toast), 300);
    }, duration);
}

buyBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const turma = document.getElementById("turma").value.trim();

    if (!name) return showToast("Digite seu nome.");
    if (!turma) return showToast("Digite sua turma.");
    if (selectedNumbers.length === 0) return showToast("Selecione pelo menos um número.");

    if (!confirm(`Confirmar reserva dos números ${selectedNumbers.join(", ")}?`)) return;

    buyBtn.disabled = true;

    for (let number of selectedNumbers) {
        if (!soldNumbers.includes(number)) {
            await addDoc(collection(db, "rifa"), {
                name,
                turma,
                number,
                status: "reservado",
                createdAt: new Date()
            });
        }
    }

    const phone = "5511946168749"; // WhatsApp da Manuela
    const text = `Olá! Reservei os números ${selectedNumbers.join(", ")} da Rifa de Páscoa. Meu nome é ${name}, turma ${turma}. Total: R$${selectedNumbers.length * 3.5}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");

    selectedNumbers = [];
    updateSummary();
    buyBtn.disabled = false;
});

loadNumbers();