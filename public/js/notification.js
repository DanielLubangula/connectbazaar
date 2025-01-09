socketMain.on("updateNotif", async (data) => {
    console.log("updateNotif", data)
    console.log("badge", document.querySelector(".notification-badge"))
    if (document.querySelector(".notification-badge")){
        document.querySelector(".notification-badge").style.display = "block"
        document.querySelector(".notification-badge").innerHTML = data.number
    }
})
