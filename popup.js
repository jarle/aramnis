function calculateHash() {
  $('hash').val('');
  // Compute the first 16 base64 characters of SHA-256
  const key = $('#key').val();
  domain = $('#domain').val().toLowerCase();

  const combination = `${domain}/${key}`;

  bits = sjcl.hash.sha256.hash(combination);
  const hash = sjcl.codec.base64.fromBits(bits).slice(0, 16);
  return hash;
};

function activate(){
  // Get the current tab.
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => {
    // Get the domain.
    let domain = "";
    let matches = tabs[0].url.match(/^http(?:s?):\/\/(?:www\.)?([^/]*)/);
    if (matches) {
      domain = matches[1].toLowerCase();
      $('#key').focus();
    }
    else {
      $('#domain').focus(); // enter domain manually
    }
    $('#domain').val(domain);

    // Listen for keys and update hash accordingly
    let timeout = null;
    function debouncedUpdate() {
      const CALCULATE_PLACEHOLDER = '[calculating';
      if (timeout) clearInterval(timeout);
      if($('#domain').val() && $('#key').val()){ // only update if domain and key present
        if(!$('#hash').val()){
          $('#hash').val(CALCULATE_PLACEHOLDER).addClass('disabled')
        }
        timeout = setTimeout((() => {
          const hash = calculateHash();
          if($('#hash').val() === CALCULATE_PLACEHOLDER && $('#hash').hasClass('disabled')) {
            $('#hash').val(hash).removeClass('disabled');
          }
        }), 200);
      }
      else {
        $('#hash').val('')
      }
    };

    // Register the update handler.
    $('#domain, #key').bind('propertychange change keyup input paste', debouncedUpdate);

    // Run the content script to register the message handler.
    chrome.tabs.executeScript(tabs[0].id, {
      file: './content_script.js'
    }, () => {
      // Check if a password field is selected.
      chrome.tabs.sendMessage(tabs[0].id, {
          type: 'aramnisCheckIfPasswordField'
        }, (response) => {
          // Different user interfaces depending on whether a password field is in focus.
          const passwordMode = (response.type === 'password');
          if (passwordMode) {
            $('#hash').val('[Press Enter to insert]').addClass('disabled');
            $('#domain, #key').keydown((e) => {
              if (e.which === 13) {
                // Try to fill the selected password field with the hash.
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'aramnisFillPasswordField',
                    hash: calculateHash()
                  }, (response) => {
                    // If successful, close the popup.
                    if (response.type === 'close') {
                      $('hash').val('');
                      window.close();
                    }
                  }
                );
              }
            });
          }
        }
      );
    });
  });
}

activate();