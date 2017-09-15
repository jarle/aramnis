$(function() {
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
      function update() {
        // Compute the first 16 base64 characters of SHA-256
        const key = $('#key').val();
        domain = $('#domain').val().toLowerCase();

        const combination = `${domain}/${key}`;

        bits = sjcl.hash.sha256.hash(combination);
        const hash = sjcl.codec.base64.fromBits(bits).slice(0, 16);
        return hash;
      };

      // A debounced version of update().
      let timeout = null;
      function debouncedUpdate() {
        if (timeout) clearInterval(timeout);
        if($('#domain').val() && $('#key').val()){ // only update if domain and key present
          if(!$('#hash').val()){
            $('#hash').val('[calculating]').addClass('disabled')
          }
          timeout = setTimeout((() => {
            const hash = update();
            $('#hash').val(hash).removeClass('disabled');
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
              $('#message').html('Press <strong>ENTER</strong> to fill in the password field.');
              $('#hash').val('[hidden]').addClass('disabled');
            } else {
              $('#message').html('<strong>TIP:</strong> Select a password field first.');
            }

            if (passwordMode) {
              // Listen for the Enter key.
              $('#domain, #key').keydown((e) => {
                if (e.which === 13) {
                  // Try to fill the selected password field with the hash.
                  chrome.tabs.sendMessage(tabs[0].id, {
                      type: 'aramnisFillPasswordField',
                      hash: update()
                    }, (response) => {
                      // If successful, close the popup.
                      if (response.type === 'close') {
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
    }
  );
});
