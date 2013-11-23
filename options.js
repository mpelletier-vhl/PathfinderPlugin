// Saves options to localStorage.
function save_options() {
  var select = document.getElementById("mode");
  var chosen_mode = select.children[select.selectedIndex].value;
  localStorage["mode"] = chosen_mode;

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 1000);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  var options_mode = localStorage["mode"];
  if (!options_mode) {
    return;
  }
  var select = document.getElementById("mode");
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == options_mode) {
      child.selected = "true";
      break;
    }
  }
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
