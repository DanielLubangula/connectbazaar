socketMain.on("updateNotif", async (data) => {

    if (document.querySelector(".notification-badge")){
        document.querySelector(".notification-badge").innerHTML = data.number
    }
})