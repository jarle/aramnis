# Aramnis

Aramnis is a Chrome extension that provides unique and personalized passwords without any hassle.

The extension combines the address of the website you are visiting with the key you enter, creating a completely new password unique to that site.
Every time you enter your key on that website, Aramnis will generate the same password.

No password is ever stored in any form by Aramnis, making it a very robust alternative to traditional password managers.

## Installation

Aramnis will be available on the Chrome extension store soon.
Until then, you can download this repository and follow the instructions on the [google developer portal](https://developer.chrome.com/extensions/getstarted#unpacked).

## A quick tour

After installation, you can quickly test the password manager [here](https://password.kaspersky.com/).

1. First select the password field, and then click the Aramnis button(nice little blue padlock in the top right) to activate the extension.
1. You can now begin typing your own password, followed by `Enter` when you are done.
1. Notice how Aramnis has entered a generated password for you in the selected input field.

Try the steps again, but this time do not select a password field prior to typing.
This time, Aramnis will display the generated password while you are typing.

You can change the domain manually if you'd like, but remember that this will change the generated password.

Congratulations; you now know how to use Aramnis!
Read on to understand the inner workings of Aramnis, and for tips when things go wrong.

## How passwords are generated

Suppose want to use the secret key `bananas` when you're signing up for Facebook. 
Aramnis would then generate a password with the following recipe:
* Combine the current domain name and your secret key with a `/` as follows: `facebook.com/bananas`. 
* Compute the [SHA-256 hash](http://en.wikipedia.org/wiki/SHA-2) of that string; this is irreversible, meaning that the original string(domain and key) cannot be recreated from the result
* Output the first 96 bits of the result, encoded as 16 characters in [Base64](http://en.wikipedia.org/wiki/Base64). 

In this example, the final output is `lqCvrzZC8jOv/CHM`, and would become your actual password for facebook. 
You now know enough to recreate this password whenever you want, and you can even write your own programs that perform the same steps.
This makes the password manager transparent(in a good way!) and extensible.


## Practical notes

* If a generated password is ever compromised, you don't need to memorize a whole new secret key and update all of your passwords. 
For that service only, just add an incrementing index to your secret key. 
Such a tiny change in your secret key results in a completely new password for that service. 
For example, if your key was `bananas`, just use `bananas2`. 
If you can't remember which iteration of your secret key you used for a particular service, simply try them all in order.

* Some websites have certain requirements on passwords, e.g., at least one number and one capital letter. 
A simple way to meet such requirements is to append something like `A9!` to the generated password (and remember you did that).

* You don't have to use the same key for every service. 
But the point of Aramnis is that you can, provided your key is strong enough.

* As with any good security software, Aramnis is open-source ([Github](https://github.com/jarle/aramnis)). 
It uses the [Stanford Javascript Crypto Library](http://bitwiseshiftleft.github.io/sjcl/) to compute SHA-256.

* Aramnis passwords can always be generated with this Python script:
    ```python
    #!/usr/bin/python -O
    import base64, getpass, hashlib

    domain = raw_input('Domain: ').strip().lower()
    key = getpass.getpass('Key: ')

    bits = domain + '/' + key
    bits = hashlib.sha256(bits).digest()
    password = base64.b64encode(bits)[:16]

    print('Password: ' + password)
    ```

## License

[MIT License](LICENSE.md)