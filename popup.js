// The hashing difficulty.
// 2 ^ difficulty rounds of SHA-256 will be computed.
const difficulty = 16;

$(function() {
  // Get the current tab.
  chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
      var showError = function(err) {
        $('#domain').val('N/A').addClass('disabled');
        $('#domain').prop('disabled', true);
        $('#key').prop('disabled', true);
        $('#hash').prop('disabled', true);
        $('p:not(#message)').addClass('disabled');
        $('#message').addClass('error').text(err);
      };

      // Make sure we got the tab.
      if (tabs.length !== 1) {
        return showError('Unable to determine active tab.');
      }

      // Get the domain.
      var domain = "";
      var matches = tabs[0].url.match(/^http(?:s?):\/\/(?:www\.)?([^/]*)/);
      if (matches) {
        domain = matches[1].toLowerCase();
      } else {
        // Example cause: files served over the file:// protocol.
        return showError('Unable to determine the domain.');
      }
      else {
        $('#domain').focus(); // enter domain manually
      }
      $('#domain').val(domain);

      // Run the content script to register the message handler.
      chrome.tabs.executeScript(tabs[0].id, {
        file: 'content_script.js'
      }, () => {
        // Check if a password field is selected.
        chrome.tabs.sendMessage(tabs[0].id, {
            type: 'aramnisCheckIfPasswordField'
          }, function(response) {
            // Different user interfaces depending on whether a password field is in focus.
            var passwordMode = (response.type === 'password');
            if (passwordMode) {
              $('#message').html('Press <strong>ENTER</strong> to fill in the password field.');
              $('#hash').val('[hidden]').addClass('disabled');
            } else {
              $('#message').html('<strong>TIP:</strong> Select a password field first.');
            }

            var update = function() {
              // Compute the first 16 base64 characters of SHA-256
              const key = $('#key').val();
              domain = $('#domain').val().replace(/^\s+|\s+$/g, '').toLowerCase();

              var rounds = Math.pow(2, difficulty);
              const combination = domain + '/' + key;

              bits = sjcl.hash.sha256.hash(combination);
              const hash = sjcl.codec.base64.fromBits(bits).slice(0, 16);
              return hash;
            };

            // A debounced version of update().
            var timeout = null;
            var debouncedUpdate = function() {
              if (timeout !== null) {
                clearInterval(timeout);
              }
              timeout = setTimeout((function() {
                if(!passwordMode){
                  const hash = update();
                  $('#hash').val(hash);
                }
                timeout = null;
              }), 200);
            };

            if (passwordMode) {
              // Listen for the Enter key.
              $('#domain, #key').keydown(function(e) {
                if (e.which === 13) {
                  // Try to fill the selected password field with the hash.
                  chrome.tabs.sendMessage(tabs[0].id, {
                      type: 'aramnisFillPasswordField',
                      hash: update()
                    }, function(response) {
                      // If successful, close the popup.
                      if (response.type === 'close') {
                        window.close();
                      }
                    }
                  );
                }
              });
            }

            if (!passwordMode) {
              // Register the update handler.
              $('#domain, #key').bind('propertychange change keyup input paste', debouncedUpdate);

              // Update the hash right away.
              debouncedUpdate();
            }

            // Focus the text field.
            $('#key').focus();
          }
        );
      });
    }
  );
});
