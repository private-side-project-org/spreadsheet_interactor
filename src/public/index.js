const form = document.getElementById("form");
const body = document.getElementById("app");
const submitButton = document.getElementById("submitButton");
const resetButton = document.getElementById("resetButton");

// get context whether user already submit form or try to resubmit WITHOUT reset button
const isSubmitted = JSON.parse(localStorage.getItem("submit")) === true;

// controller to define whether call API or not
let shouldPreventAPICall = false;

// disabled reset button until submit form
resetButton.setAttribute("disabled", true);

const reomveResults = () => {
  // remove all result <ul></ul>
  const results = document.getElementById("results");
  results.remove();

  // remove totalScore
  const totalScoreH1 = document.getElementById("totalScore");
  totalScoreH1.remove();
};

// reset event
resetButton.addEventListener("click", (e) => {
  e.preventDefault();
  // reset form
  form.reset();

  // disabled reset button
  resetButton.setAttribute("disabled", true);

  // remove results and totalScore
  reomveResults();

  // remove submit context from localStorage
  localStorage.removeItem("submit");

  // reset controller false
  if (shouldPreventAPICall) {
    shouldPreventAPICall = false;
  }
});

let checkedInputs = [];

if (checkedInputs.length === 0) {
  submitButton.setAttribute("disabled", true);
  if (isSubmitted) {
    // remove submit context if user submit and refresh page
    localStorage.removeItem("submit");
  }
}

body.addEventListener("change", (e) => {
  checkedInputs = [...document.getElementsByTagName("input")].filter(
    (input) => input.checked === true
  );
  if (checkedInputs.length > 0) {
    submitButton.removeAttribute("disabled");
  }
});

// form submit event
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // isSubmitted UNDER submit moment(Different from line7)
  // get context whether user already submit form or try to resubmit WITHOUT reset button
  const isSubmitted = JSON.parse(localStorage.getItem("submit")) === true;

  /* clean up when user re-submit after validation */
  // get invalidMessages for the case user revise question and re-submit
  const invalidMessages = document.querySelectorAll("#tooManyChecks, #warning");

  if (invalidMessages.length > 0) {
    // remove previsou invalid messages if still existing
    [...invalidMessages].forEach((invalidMessage) => invalidMessage.remove());
  }

  // get results when user re-submit
  const results = isSubmitted
    ? document.getElementById("results").children
    : [];

  if (results.length > 0) {
    reomveResults();
  }

  // FINISH clean up when user re-submit

  // get inputs of each question [q_1Node, q_2Node...]
  const inputWrappers = [...document.getElementsByClassName("q_input_wrapper")];

  // check validation(no checkmark or too many check marks)
  inputWrappers.forEach((wrapper, index) => {
    // get checked inputs of each question
    const checkedInputInQuestion = [...wrapper.children].filter(
      (input) => input.checked === true
    );

    // no checkmark in single question(no answer)
    if (checkedInputInQuestion.length === 0) {
      const warning = document.createElement("p");
      warning.setAttribute("id", "warning");
      warning.textContent = `Please check question ${index}`;
      body.append(warning);
      shouldPreventAPICall = true;
      return;
    }

    // too many check marks in single question
    if (checkedInputInQuestion.length > 1) {
      const tooManyChecks = document.createElement("p");
      tooManyChecks.setAttribute("id", "tooManyChecks");
      tooManyChecks.textContent = `You have checked too many on question ${
        index + 1
      }`;
      body.append(tooManyChecks);
      shouldPreventAPICall = true;
      return;
    }
    // return nothing if valid
    return;
  });

  // prevent API call when answer is invlid
  if (shouldPreventAPICall) {
    shouldPreventAPICall = false;
    // reset submit context if it is invlid
    localStorage.setItem("submit", false);

    // return with nothing to preventAPI call
    return;
  } else if (!shouldPreventAPICall && invalidMessages) {
    // remove invlid message when re-submit after user revise checkmark which is valid
    [...invalidMessages].forEach((invalidMessage) => invalidMessage.remove());
  }

  // calculate score
  const totalScore = checkedInputs.reduce((acc, input) => {
    return (acc += parseInt(input.value, 10));
  }, 0);

  // create h1 tag for display totalScore
  const h = document.createElement("h1");

  // set id to remove when user re-submit
  h.setAttribute("id", "totalScore");

  // add totalScore
  const scoreValue = document.createTextNode(`Your score is ${totalScore}`);

  // append text into h1
  h.append(scoreValue);

  // append h1 into body
  body.append(h);

  // not allow re-submit after submit unless click reset button
  submitButton.setAttribute("disabled", true);

  // post request send total score to server(node.js(express))
  const response = await fetch("/api/v1/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      totalScore,
    }),
  });

  const professors = await response.json();

  if (professors) {
    // create <ul></ul>
    const ul = document.createElement("ul");
    // add results id to remove when user re-submit
    ul.setAttribute("id", "results");

    professors.map((professor) => {
      const li = document.createElement("li");
      const firstName = document.createElement("p");
      const lastName = document.createElement("p");
      const score = document.createElement("p");
      const location = document.createElement("p");
      firstName.textContent = `First name: ${professor.first_name}`;
      lastName.textContent = `Last name: ${professor.last_name}`;
      score.textContent = `Score: ${professor.score}`;
      location.textContent = `Location: ${professor.location}`;
      li.append(firstName);
      li.append(lastName);
      li.append(location);
      li.append(score);

      ul.append(li);
    });

    body.append(ul);
    resetButton.removeAttribute("disabled");

    // set localStorate submit
    localStorage.setItem("submit", true);
  }
});
