const modal = document.getElementById("confirmModal");
const confirmBtn = document.getElementById("confirmModalBtn");
const cancelBtn = document.getElementById("cancelModal");

const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");

let activeForm = null;

function closeModal() {
  modal.classList.add("hidden");
  activeForm = null;
}

document
  .querySelectorAll(".delete-trigger")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      activeForm = btn.closest("form");

      modalTitle.textContent = btn.dataset.title;
      modalMessage.textContent = btn.dataset.message;

      modal.classList.remove("hidden");
    });
  });

confirmBtn.addEventListener("click", () => {
  if (activeForm) {
    activeForm.submit();
  }
});

cancelBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});