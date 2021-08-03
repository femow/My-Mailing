document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email("", "", ""));
  
  document.querySelector("#compose-form").onsubmit = function(event) {
    _recipe = document.querySelector("#compose-recipients").value
    _subject = document.querySelector("#compose-subject").value
    _body = document.querySelector("#compose-body").value

    if(_recipe != "") {
        fetch('/emails', {
          method: 'POST',
          body: JSON.stringify({
            recipients: _recipe,
            subject: _subject,
            body: _body
          })
        })
        .then(resp => resp.json())
        .then(data => {
          if(data.error) {
            console.log(data.error);
            return;
          }
          load_mailbox('sent');
          return;
        })
        .catch(err => {
          console.log(err)
        });
    }
    else {
      // Log that the recipe is empty
      console.log("Recipe is empty");
    }


    event.preventDefault();
  };

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(recipe, subject, body) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipe;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

function create_email_div(mailbox, element) {
  const _button = document.createElement('button');
  const _div = document.createElement('div');
  const _h4 = document.createElement('h4');
  const _span = document.createElement('span')
  const _span2 = document.createElement('span')

  _button.className = "button-email" + (element.read ? " button-email-readed" : "")
  _button.addEventListener('click', function() {
    load_mail(mailbox, element)
  })

  if(mailbox == "sent") {
    _h4.innerText = "To: " + element.recipients[0];
  }
  else {
    _h4.innerText =  element.sender;
  }
  _span.innerText = element.subject;
  _span2.innerText = element.timestamp;

  _div.append(_h4);
  _div.append(_span);
  _div.className = "button-email-div"
  _button.append(_div)
  _button.append(_span2)
  return _button
}

function load_mail(mailbox, mail) {
  // Hide compose view and other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  const email_view = document.querySelector('#email-view')
  email_view.innerHTML = ""


  // Mark an email as read
  fetch(`/emails/${mail.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  .then(resp => {
    if(resp.status == 204) {
      const _span1 = document.createElement('span')
      _span1.innerHTML = `<span><strong>From: </strong>${mail.sender}<br></span>`;
      const _span2 = document.createElement('span')
      _span2text = mail.recipients[0]
      for (let i = 1; i < mail.recipients.length; i++) {
        const element = mail.recipients[i];
        _span2text += ", " + element;
      }
      _span2.innerHTML = `<span><strong>To: </strong>${_span2text}<br></span>`;
      const _span3 = document.createElement('span')
      _span3.innerHTML = `<span><strong>Subject: </strong>${mail.subject}<br></span>`;
      const _span4 = document.createElement('span')
      _span4.innerHTML = `<span><strong>Timestamp: </strong>${mail.timestamp}<br></span>`;

      let _subject = ""
      if((mail.subject.length > 3 && mail.subject.substring(0, 3) != "Re:")) {
        _subject = "Re: " + mail.subject
      }
      else {
        _subject = mail.subject
      }

      let _body = `On ${mail.timestamp} ${mail.sender} wrote: ${mail.body}`

      const _button = document.createElement('button');
      _button.className = "btn btn-sm btn-outline-primary"
      _button.innerText = "Reply"
      _button.addEventListener('click', () => compose_email(mail.sender, _subject, _body))

      email_view.append(_span1);
      email_view.append(_span2);
      email_view.append(_span3);
      email_view.append(_span4);
      email_view.append(_button);
      
      
      const _button2 = document.createElement('button');
      _button2.className = "btn btn-sm btn-outline-primary"
      if(mailbox == "inbox") {
        _button2.innerText = "Archive"
        _button2.addEventListener('click', () => {
          fetch(`/emails/${mail.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
            })
          })
          .then(resp => load_mailbox("inbox"))
        })
        email_view.append(_button2);
      }
      else if(mailbox == "archive") {
        _button2.innerText = "Unarchive"
        _button2.addEventListener('click', () => {
          fetch(`/emails/${mail.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          })
          .then(resp => load_mailbox("inbox"))
        })
        email_view.append(_button2);
      }
      
      const _hr = document.createElement('hr')
      const _span5 = document.createElement('span')
      _span5.innerText = mail.body

      email_view.append(_hr);
      email_view.append(_span5);
    }
  })

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`, {
    method: 'GET',
  })
  .then(resp => resp.json())
  .then(data => {
    if(data.error) {
    }
    else {
      data.forEach(element => {
        const emails_div = document.querySelector('#emails-view')
        emails_div.append(create_email_div(mailbox, element))
      });
    }    

  })
  .catch(err => {
    console.log(err)
  });
}