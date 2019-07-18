const socket = io()
//elements:
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#locationMessage-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () =>{
    //New message element
    const $newMessage = $messages.lastElementChild
    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    //visible height
    const visibleHeight = $messages.offsetHeight
    //Height of messages container
    const containerHeight = $messages.scrollHeight
    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    //logic
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message)=>{
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    //disable
    const messageToSend = e.target.elements.message

    socket.emit('sendMessage', messageToSend.value, (error)=>{
        //enable
        $messageFormButton.removeAttribute('disabled', 'disabled')
        messageToSend.value = ''
        $messageFormInput.focus()

        if (error){
            return console.log(error)
        }
        console.log('The message was delivered')
    })
})

$sendLocationButton.addEventListener('click', ()=>{
    $sendLocationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation', {lat: position.coords.latitude, long: position.coords.longitude}, ()=>{
            console.log('Location Shared!')
            $sendLocationButton.removeAttribute('disabled', 'disabled')
        })
    })
})

socket.on('roomData', ({room, users}) =>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', {username, room}, (error) =>{
    if(error){
        alert(error)
        location.href = '/'
    }
})

//Count app:
// socket.on('countUpdated', (count)=>{
//     console.log('the count is updated to ' + count)
// })

// document.querySelector('#increment').addEventListener('click', ()=>{
//     console.log('click')
//     socket.emit('increment')
// })