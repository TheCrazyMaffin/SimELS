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
            this.updateCall(newId, {
                id: newId,
                created: Date.now(),
                type: "",
                additionalInfo: "",
                scratchpad: "",
                location: {
                    coordinates: [0, 0],
                    address: "",
                    additionalInfo: ""
                }
            })
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
function refreshCallList(){
    const containerEl = document.querySelector("#callListContainer")
    const callList = calls.getCalls()
    containerEl.innerHTML = ""
    for(c of callList){
        containerEl.innerHTML += `
            <tr data-callId="${c.id}" onclick="showCall('${c.id}')">
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
function showCall(id){
    const currentlySelected = document.querySelector(`[data-callId].is-info`)
    if(currentlySelected !== null) currentlySelected.classList.remove("is-info")
    const callListElement = document.querySelector(`[data-callId="${id}"]`)
    callListElement.classList.add("is-info")
    const c = calls.getCall(id)
    console.log(c)
    const toReplace = {
        "#callId": id,
        "#callLocationCoordinatesLng": c.location.coordinates[0],
        "#callLocationCoordinatesLat": c.location.coordinates[1],
        "#callCreatedAt": (new Date(c.created)).toLocaleString("de"),
        "#callType": c.type,
        "#callLocationAddress": c.location.address,
        "#callLocationAdditionalInfo": c.location.additionalInfo
    }
    document.querySelector("#callId").value = id
    document.querySelector("#noCall").hidden = true;
    document.querySelector("#callInterface").hidden = false;
}

function closeCall(){
    document.querySelector("#noCall").hidden = false;
    document.querySelector("#callInterface").hidden = true;
}

function getLocFromMap(){
    einsatzMarker
}

//
// Config
//

// For use with http://bboxfinder.com
function setBBox(lng1, lat1, lng2, lat2){
    const bbox = [[lng1, lat1], [lng2, lat2]]
    
    window.localStorage.setItem("bbox", JSON.stringify(bbox))
}

function getBBox(){
    const bbox = window.localStorage.getItem("bbox")
    if(bbox === null){
        setBBox(8.924847, 48.940205, 9.105778, 49.045070)
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