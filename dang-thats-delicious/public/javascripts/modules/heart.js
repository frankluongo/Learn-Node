import { $ } from "./bling";

export default class Heart {
  constructor(heartForms) {
    if (!heartForms) return;
    this.heartForms = heartForms;
    this.heartCount = $('[data-ref="HeartCount"]');
    this.heartForms.on("submit", this.handleHeartFormSubmit.bind(this));
  }

  async handleHeartFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    try {
      const res = await fetch(form.action, { method: form.method });
      const { hearts } = await res.json();
      const isHearted = form.heart.classList.toggle("heart__button--hearted");
      this.heartCount.textContent = hearts.length;
      if (isHearted) {
        form.heart.classList.add("heart__button--float");
        setTimeout(() => {
          form.heart.classList.remove("heart__button--float");
        }, 2000);
      }
    } catch (error) {
      alert("Oh No! Something went wrong");
      throw new Error(error);
    }
  }
}
