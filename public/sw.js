/*
Copyright 2017 August Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
(function() {
  'use strict';

  self.addEventListener('install', function(e) {
    console.log('Service worker installed');
    self.skipWaiting();
  });

  // TODO 2.6 - Handle the notificationclose event
  self.addEventListener('notificationclose', function(e) {
    var notification = e.notification;
    var primaryKey = notification.data.primaryKey;

    console.log('Closed notification: ' + primaryKey);
  });

  // TODO 2.7 - Handle the notificationclick event

  self.addEventListener('notificationclick', function(e) {

    // TODO 2.8 - change the code to open a custom page
    var notification = e.notification;
    var primaryKey = notification.data.primaryKey;
    var action = e.action;

    if (action === 'close') {
      notification.close();
    } else {

      e.waitUntil(
        clients.matchAll().then(function(clis) {
          var client = clis.find(function(c) {
            return c.visibilityState === 'visible';
          });
          if (client !== undefined) {
            client.navigate('profile/'+primaryKey);
            client.focus();
          } else {
            // there are no visible windows. Open one.
            clients.openWindow('profile/'+primaryKey);
            notification.close();
          }
        })
      );
      /*
      clients.openWindow('samples/page' + primaryKey + '.html');
      notification.close();*/
    }

    // TODO 5.3 - close all notifications when one is clicked
    self.registration.getNotifications().then(function(notifications) {
      notifications.forEach(function(notification) {
        notification.close();
      });
    });

  });

  // TODO 3.1 - add push event listener
  self.addEventListener('push', function(e) {
    
    var body;
    
    let payload = e.data.json();
    if (e.data) {
        
      body = payload.notification;
    } else {
      body = 'Default body';
    }

    var options = {
      icon: 'images/profile/'+payload.from+'.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: payload.from
      }
    };
    if(payload.salary){
        let icon = payload.salary.change>0?'up':'down';
        if(payload.salary.change==0) icon='same';
        //options.image = 'images/'+icon+'.png';
        /*
        options.actions =  [{
            action: 'explore', 
            title: 'Income changed by '+payload.salary.change,
            icon: 'images/'+icon+'.png'
        }];*/
    }
    e.waitUntil(
      clients.matchAll().then(function(c) {
        console.log(c);
        if (c.length === 0) {
          console.log("No client seeing screen");
          // Show notification
          self.registration.showNotification(payload.notification, options);
        } else {
          // Send a message to the page to update the UI
          console.log('Application is already open!');
          self.registration.showNotification(payload.notification, options);
        }
      })
    );
  });

})();