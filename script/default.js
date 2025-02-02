//
// Calls
//
const rawCallStructure = () => {return({
    id: "",
    created: Date.now(),
    type: "",
    additionalInfo: "",
    scratchpad: "",
    location: {
        coordinates: [0, 0],
        address: "",
        additionalInfo: ""
    }
})}

//
// Storage
//
const storage = {
    get(name){
        return JSON.parse(window.localStorage.getItem(name))
    },
    set(name, data){
        return window.localStorage.setItem(name, JSON.stringify(data))
    },
    remove(name){
        return window.localStorage.removeItem(name)
    }
}
if(storage.get("archivedCallList") === null){storage.set("archivedCallList", [])}
if(storage.get("callList") === null){storage.set("callList", [])}


//
// Einsätze
//
const calls = {
    getCall(id){
        return storage.get(id)
    },
    getCalls(archived = false){
        const callList = storage.get(archived ? "archivedCallList" : "callList")
            const callListData = []
            for (const e of callList) {
                const eData = storage.get(e)
                if(eData === null){
                    console.error(`No data for call "${e}". Will be removed`)
                    this._deleteCall(e)
                }else{
                    callListData.push(eData)
                }
            }
            return callListData
    },
    updateCall(id, data){
        const callList = storage.get("callList")
        const archivedCallList = storage.get("archivedCallList")
        if(callList.indexOf(id) !== -1 || archivedCallList.indexOf(id) !== -1){
            storage.set(id, data)
        }else{
            console.error(`No call wtih identifier "${id}".`)
        }
    },
    newCall(){
        const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        // https://stackoverflow.com/questions/58325771/how-to-generate-random-hex-string-in-javascript
        const callList = storage.get("callList")
        const archivedCallList = storage.get("archivedCallList")
        const newId = genRanHex(12)
        if(callList.indexOf(newId) === -1 && archivedCallList.indexOf(newId) === -1){
            callList.push(newId)
            storage.set("callList", callList)
            const callStructure = rawCallStructure()
            callStructure.id = newId
            this.updateCall(newId, callStructure)
            return newId
        }else{
            return this.newCall()
        }
    },
    archiveCall(id){
        const callList = storage.get("callList")
        const archivedCallList = storage.get("archivedCallList")
        if(callList === null && callList.indexOf(id) === -1){
            console.error("Cannot archive. Not found in active calls.")
        }else{
            callList.splice(callList.indexOf(id), 1)
            storage.set("callList", callList)
            archivedCallList.push(id)
            storage.set("archivedCallList", archivedCallList)
        }
    },
    _deleteCall(id){
        const callList = storage.get("callList")
        if(callList !== null && callList.indexOf(id) !== -1){
            callList.splice(callList.indexOf(id), 1)
            storage.set("callList", callList)
        }
        const archivedCallList = window.localStorage.getItem("archivedCallList")
        if(archivedCallList !== null && archivedCallList.indexOf(id) !== -1){
            archivedCallList.splice(archivedCallList.indexOf(id), 1)
            storage.set("archivedCallList", archivedCallList)
        }
        storage.remove(id)
        return
    }
}

//
// Einsatzliste
//
function refreshCallList(archived = false){
    const containerEl = document.querySelector("#callListContainer")
    const activeCall = document.querySelector(".is-sel")?.dataset.callid
    const callList = calls.getCalls(archived)
    callList.reverse()
    containerEl.innerHTML = ""
    for(c of callList){
        containerEl.innerHTML += `
            <tr data-callId="${c.id}" class="${activeCall === c.id ? "is-sel" : ""}" onclick="showCall('${c.id}')">
                <td>${(new Date(c.created)).toLocaleTimeString("de")}</td>
                <td>${c.type}</td>
                <td>${c.location.address}</td>
            </tr>
        `
    }
}

//
// Einsatzmaske
//
function fillCallMask(toReplace){
    for(k in toReplace){
        const el = document.querySelector(k)
        el.value = toReplace[k]
    }
}

function getCallMaskData(){
    const call = rawCallStructure()
    function s(selector){return document.querySelector(selector).value}
    call.id = s("#callId")
    call.created = parseInt(s("#callCreated"))
    call.type = s("#callType")
    call.additionalInfo = s("#callAdditionalInfo")
    call.scratchpad = s("#callScratchpad")
    call.location.coordinates = [parseFloat(s("#callLocationCoordinatesLng")), parseFloat(s("#callLocationCoordinatesLat"))]
    call.location.address = s("#callLocationAddress")
    call.location.additionalInfo = s("#callLocationAdditionalInfo")
    return call
}

function showCall(id, zoom = true){
    refreshCallList()
    const currentlySelected = document.querySelector(`[data-callId].is-sel`)
    if(currentlySelected !== null) currentlySelected.classList.remove("is-sel")
    const callListElement = document.querySelector(`[data-callId="${id}"]`)
    callListElement.classList.add("is-sel")
    const c = calls.getCall(id)
    console.log(c)
    const toReplace = {
        "#callId": id,
        "#callLocationCoordinatesLng": c.location.coordinates[0],
        "#callLocationCoordinatesLat": c.location.coordinates[1],
        "#callCreated": c.created,
        "#callCreatedFormatted": (new Date(c.created)).toLocaleString("de"),
        "#callType": c.type,
        "#callLocationAddress": c.location.address,
        "#callLocationAdditionalInfo": c.location.additionalInfo,
        "#callAdditionalInfo": c.additionalInfo,
        "#callScratchpad": c.scratchpad
    }
    fillCallMask(toReplace)
    einsatzMarker.setLngLat(c.location.coordinates)
    if(zoom === true && !(c.location.coordinates[0] === 0 && c.location.coordinates[1] === 0)){
        map.flyTo({
            center: c.location.coordinates,
            zoom: 15
        })
    }
    document.querySelector("#noCall").hidden = true;
    document.querySelector("#callInterface").hidden = false;
}

function saveCall(){
    const newData = getCallMaskData()
    calls.updateCall(newData.id, newData)
}

function closeCall(){
    document.querySelector("#noCall").hidden = false;
    document.querySelector("#callInterface").hidden = true;
}

function getLocFromMap(withAdrShortText = true){
    const lngLat = einsatzMarker.getLngLat()
    const toReplace = {
        "#callLocationCoordinatesLng": lngLat.lng,
        "#callLocationCoordinatesLat": lngLat.lat,
    }
    if(withAdrShortText){
        toReplace["#callLocationAddress"] = einsatzMarker.adrShort || ""
    }
    fillCallMask(toReplace)
    saveCall()
    refreshCallList()
}

function callMaskArchive(){
    const callId = document.querySelector("#callId").value
    calls.archiveCall(callId)
    einsatzMarker.setLngLat([0,0])
    closeCall()
    refreshCallList()
}

function callMaskPrint(){
    
}

function callMaskAlert(){
    const alertAudio = window.localStorage.getItem("alertAudio")
    if(alertAudio !== null){
        const aud = new Audio(alertAudio)
        aud.play();
    }
}

//
// Config
//

// For use with http://bboxfinder.com
function setBBox(str){
    const [lng1, lat1, lng2, lat2] = (str.split(","))
    const bbox = [[parseFloat(lng1), parseFloat(lat1)], [parseFloat(lng2), parseFloat(lat2)]]
    
    window.localStorage.setItem("bbox", JSON.stringify(bbox))
}

function getBBox(){
    const bbox = window.localStorage.getItem("bbox")
    if(bbox === null){
        setBBox("5.273438,46.679594,15.820313,55.478853")
        return getBBox()
    }else{
        return JSON.parse(bbox)
    }
}

function getBBoxCenter(bbox){
    const lng = (bbox[0][0] + bbox[1][0]) / 2
    const lat = (bbox[0][1] + bbox[1][1]) / 2
    return [lng, lat]
}

//
// Vehicle tracking
//
const vehicleTracking = ((window.localStorage.getItem("vehicleTracking") || "0") === "1" ? true : false)
const vehicleMarkers = []
const vehicles = storage.get("vehicles") || {}

if(vehicleTracking){
    const baseUrl = window.localStorage.getItem("traccarUrl")
    const token = window.localStorage.getItem("traccarToken")
    const bearer = `Bearer ${token}`
    const fetchOptions = {
        method: "GET",
        withCredentials: true,
        credentials: "include",
        headers: {
            "Authorization": bearer,
            "Content-Type": "application/json"
        }
    }
    console.log("Vehicle tracking enabled")
    fetch(`${baseUrl}devices`, fetchOptions)
    .then(async (res) => {
        const resJSON = await res.json()
        for (const e of resJSON) {
            vehicles[e.id] = e.name
        }
        storage.set("vehicles", vehicles)
    }).catch(console.error)
    setInterval(async () => {
        fetch(`${baseUrl}positions`, fetchOptions)
        .then(async (res) => {
            for(v of vehicleMarkers){
                v.remove()
                vehicleMarkers.shift()
            }
            for(v of await res.json()){
                const el = document.createElement('div');
                el.className = 'marker';
                el.style.backgroundImage = "url(images/vehicleMarker.svg)"
                el.style.backgroundRepeat = "no-repeat"
                el.style.backgroundSize = "contain"
                el.style.width = `40px`
                el.style.height = `40px`
                const spanEl = document.createElement("span")
                spanEl.innerText = vehicles[v.deviceId]
                el.appendChild(spanEl)

                const markerProperties = {
                    element: el,
                    anchor: "center"
                }
                vehicleMarkers.push(new maplibregl.Marker(markerProperties)
                .setLngLat([v.longitude, v.latitude])
                .addTo(map))
                document.querySelector("#trackingMarker").classList.add("active")
                setTimeout(() => {
                    document.querySelector("#trackingMarker").classList.remove("active")
                }, 15 * 1000)
            }
        }).catch(console.error)
    }, 15 * 1000)
}