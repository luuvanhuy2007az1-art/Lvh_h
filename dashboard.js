import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const fileList = document.getElementById('fileList');
const shareResult = document.getElementById('shareResult');
const shareLinkInput = document.getElementById('shareLinkInput');

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 2000);
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    shareResult.style.display = 'none';
    const fileName = Date.now() + "_" + file.name;
    const storageRef = ref(storage, 'uploads/' + fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);
    const uploadArea = document.querySelector('.upload-area p');
    uploadArea.innerText = "⏳ Đang tải lên... 0%";

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploadProgress.style.width = progress + '%';
            uploadArea.innerText = `⏳ Đang tải lên... ${Math.round(progress)}%`;
        }, 
        (error) => {
            alert("Lỗi: " + error.message);
            uploadArea.innerText = "Bấm vào đây để chọn file";
            uploadProgress.style.width = '0%';
        }, 
        async () => {
            uploadArea.innerText = "⚙️ Đang tạo link...";
            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                await addDoc(collection(db, "files"), {
                    name: file.name, size: file.size, url: downloadURL, path: storageRef.fullPath, createdAt: Date.now()
                });
                shareLinkInput.value = downloadURL;
                shareResult.style.display = 'block';
                uploadProgress.style.width = '0%';
                uploadArea.innerText = "Bấm vào đây để chọn file";
                fileInput.value = ""; 
                showToast("Tạo link thành công!");
            } catch (err) {
                alert("Lỗi: " + err.message);
                uploadArea.innerText = "Bấm vào đây để chọn file";
            }
        }
    );
});

onSnapshot(collection(db, "files"), (snapshot) => {
    fileList.innerHTML = "";
    if (snapshot.empty) {
        fileList.innerHTML = "<p style='color: #888'>Chưa có file nào.</p>";
        return;
    }
    const docs = snapshot.docs.sort((a, b) => b.data().createdAt - a.data().createdAt);
    docs.forEach((docSnap) => {
        const data = docSnap.data();
        const sizeMB = (data.size / (1024 * 1024)).toFixed(2);
        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
            <div class="file-info">
                <div class="file-icon">📄</div>
                <div>
                    <div class="file-name">${data.name}</div>
                    <div class="file-meta">${sizeMB} MB</div>
                </div>
            </div>
            <div class="action-btns">
                <a href="${data.url}" target="_blank" class="btn-download">Tải</a>
                <button onclick="copyLink('${data.url}')" class="btn-copy">Link</button>
                <button onclick="deleteFile('${docSnap.id}', '${data.path}')" class="btn-delete">Xóa</button>
            </div>
        `;
        fileList.appendChild(card);
    });
});

window.copyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => showToast("Đã copy link!")).catch(() => showToast("Lỗi copy!"));
};

window.deleteFile = async (id, path) => {
    if (confirm("Xóa file vĩnh viễn?")) {
        try {
            await deleteDoc(doc(db, "files", id));
            await deleteObject(ref(storage, path));
            showToast("Đã xóa!");
        } catch (e) { alert("Lỗi xóa: " + e.message); }
    }
};
