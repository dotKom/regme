/**
 * The input field. Should only fetch input from
 * user or RFID-reader, then let the core
 * application validate the rest.
 * 
 * @prop {string} placeholder The placeholder text for the input field.
 */
const Input = ( { placeholder, onSubmit } ) => {
  let message = ""
  let submit = (evt) => {
    evt.preventDefault()
    onSubmit(message)
  }

  let change = (evt) => {
    message = evt.target.value
  }

  return (
    <form onSubmit={ submit }>
      <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label registration-input">
        <input className="mdl-textfield__input"
          type="text"
          id="registration-input"
          pattern="[A-Za-z\s]+|[0-9]+"
          onChange={ change } />
        <label className="mdl-textfield__label"
          htmlFor="registration-input">{ placeholder }</label>
        <span className="mdl-textfield__error">Input er ikke gyldig!</span>
      </div>
    </form>
  )
}

export default Input
