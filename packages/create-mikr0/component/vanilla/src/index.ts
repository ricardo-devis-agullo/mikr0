import { createComponent } from "mikr0/dev";
import javascriptLogo from "./javascript.svg";
import style from "./style.module.css";

// eslint-disable-next-line react-refresh/only-export-components
export default createComponent({
  parameters: {
    name: {
      type: "string",
      mandatory: true,
      example: "Mikr0",
      description: "Name of the component",
      default: "Mikr0",
    },
  },
  async loader({ parameters: { name }, headers }) {
    const lang = headers["accept-language"]?.split(",")[0] ?? "en";
    return { name, lang };
  },
  mount(element, props) {
    element.innerHTML = /* html */ `
    <div class="${style.container}">
      <a href="https://react.dev" target="_blank" rel="noreferrer">
         <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
      </a>
      <button
        class="${style.button}"
        type="button"
      >
        Hi, ${props.name}! Click me! The count is 
        <span>0</span>
      </button>
    </div>
`;

    let count = 0;
    element.querySelector("button")!.addEventListener("click", () => {
      const formatted = new Intl.NumberFormat(props.lang, {
        maximumSignificantDigits: 3,
      }).format(++count);
      element.querySelector("span")!.textContent = formatted;
    });
  },
  unmount(element) {
    element.innerHTML = "";
  },
});
