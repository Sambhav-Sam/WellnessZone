const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
// const messageTemplate = document.querySelector('#message-template').innerHTML
const messageTemplate = `<div class="message"><p><span class="message__name">{{username}}</span><span class="message__meta">{{createdAt}}</span></p><p>{{message}}</p></div>`
// const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const locationMessageTemplate = `<div class="message"><p><span class="message__name">{{username}}</span><span class="message__meta">{{createdAt}}</span></p><p><a href="{{url}}" target="_blank">My current location</a></p></div>`
// const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const sidebarTemplate = `<h2 class="room-title">{{room}}</h2><h3 class="list-title">Users</h3><ul class="users">{{#users}}<li>{{name}}</li>{{/users}}</ul>`

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('history',(messages)=>{
    // console.log(messages);
    for(let i=0;i<messages.length;i++){
        let message = messages[i];
        if(message.url!="")
        {
            const html = Mustache.render(locationMessageTemplate, {
                username: message.username,
                url: message.url,
                createdAt: moment(message.createdAt).format('h:mm a')
            })
            $messages.insertAdjacentHTML('beforeend', html)
            autoscroll()
        }
        else{
            const html = Mustache.render(messageTemplate, {
                username: message.username,
                message: message.text,
                createdAt: moment(message.createdAt).format('h:mm a')
            })
            $messages.insertAdjacentHTML('beforeend', html)
            autoscroll()
        }
    }
})

socket.on('message', (message) => {
    // console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    // console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')  
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/user/home'
    }
})