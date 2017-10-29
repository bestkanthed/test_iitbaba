var app = (function() {
  'use strict';

  var applicationServerPublicKey = 'BDzJ8pdjS6uYuL2BOi7LxPn8-WBn36X1OSp7QrIn0fl1KwRCgLkXEgP0ZFq4MzJOfWHqRNOaJiC5EB9IbSnlTtI';
  var isSubscribed = false;
  var swRegistration = null;
  // TODO 2.1 - check for notification support
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications!');
    return;
  }else console.log('Notifications supported!');

  // TODO 2.2 - request permission to show notifications
  Notification.requestPermission(function(status) {
    console.log('Notification permission status:', status);
    if(status=='denied'){
      $('#allow-push').text("ALLOW PUSH NOTIFICATIONS");
      $("#allow-push").attr("href", "https://support.google.com/chrome/answer/3220216?co=GENIE.Platform%3DDesktop&hl=en");
    }
  });
  
  function subscribeUser() {

    var applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    // TODO 3.4 - subscribe to the push service
    swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    })
    .then(function(subscription) {
      console.log('User is subscribed:', subscription);

      isSubscribed = updateSubscriptionOnServer(JSON.stringify(subscription));
    })
    .catch(function(err) {
      if (Notification.permission === 'denied') {
        console.warn('Permission for notifications was denied');
        console.log(err);
      } else {
        console.error('Failed to subscribe the user: ', err);
      }
    });

  }

  function displayNotification() {
    if (Notification.permission == 'granted') {
      navigator.serviceWorker.getRegistration().then(function(reg) {

        // TODO 2.4 - Add 'options' object to configure the notification
        var options = {
          body: 'First notification!',
          icon: 'images/notification-flat.png',
          vibrate: [100, 50, 100],
          data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
          },

          // TODO 2.5 - add actions to the notification
          actions: [
            {action: 'explore', title: 'Go to the site',
              icon: 'images/checkmark.png'},
            {action: 'close', title: 'Close the notification',
              icon: 'images/xmark.png'},
          ],

          tag: 'id1'
          // TODO 5.1 - add a tag to the notification

        };

        reg.showNotification('Hello world!', options);
      });
    }

    // TODO 2.3 - display a Notification

  }

  function initializeUI() {
    
    // TODO 3.3b - add a click event listener to the "Enable Push" button
    // and get the subscription object
    swRegistration.pushManager.getSubscription()
    .then(function(subscription) {
      console.log("logging subs");
      console.log(JSON.stringify(subscription));
      isSubscribed = (subscription !== null);
      if(!isSubscribed) return subscribeUser();
      updateSubscriptionOnServer(JSON.stringify(subscription));
      if (isSubscribed) {
        console.log('User IS subscribed.');
      } else {
        console.log('User is NOT subscribed.');
      }
    });
  }

  // TODO 4.2a - add VAPID public key

  function updateSubscriptionOnServer(subscription) {
    // Here's where you would send the subscription to the application server
    $.post( "/subscription", {subscription: subscription})
    .done(function( data ) {
        console.log( "Data Loaded: " + data );
        return true;
    });
  }

  function urlB64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Push is supported');

    navigator.serviceWorker.register('sw.js')
    .then(function(swReg) {
      console.log('Service Worker is registered', swReg);

      swRegistration = swReg;

      // TODO 3.3a - call the initializeUI() function
      initializeUI();

    })
    .catch(function(error) {
      console.error('Service Worker Error', error);
    });
  } else {
    console.warn('Push messaging is not supported');
    pushButton.textContent = 'Push Not Supported';
  }

})();

$(function () {
    $('body').show();
});