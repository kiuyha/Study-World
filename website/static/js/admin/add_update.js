let typingTimer;
const typingDelay = 500;
let content = {'id': document.getElementById('tempcontent_id').value };
const statusIndicator = document.querySelector('#cloud-btn');

// Tiny MCE script
tinymce.init({
    selector: '#editor',
    height: '100%',
    plugins: [
        'advlist','autolink','link','image','charmap','preview','code', 'anchor', 'pagebreak',
        'searchreplace', 'wordcount', 'visualblocks', 'visualchars', 'fullscreen', 'media',
        'table', 'math', 'lists', 'liststyles', "fullpage"
    ],
    toolbar: [
        'code | undo redo | styles | bold italic underline | alignleft aligncenter alignright alignjustify |'+
        'bullist numlist outdent indent math | removeformat | link image | pagebreak | media | table',
    ],
    menubar: false,
    automatic_uploads: true,
    branding: false,
    image_advtab: true,
    math_inline_default: true,
    convert_urls: false,
    valid_elements: '[]',
    verify_html: false,
    cleanup_on_startup: false,
    cleanup: false,
    trim_span_elements: false,
    fix_table_elements: false,
    schema: 'html5',
    invalid_elements: '',
    valid_children: '[]',
    math: {
        defaultMode: 'inline',
    },
    images_upload_handler: (blobInfo) => new Promise((resolve, reject) => {
            const reader = new FileReader(); // Create a new FileReader instance
            
            // Event handler when the file is successfully read
            reader.onload = () => {
                const base64data = reader.result.split(',')[1]; // Get the base64-encoded image data (skip the "data:image/png;base64," part)
                
                // Resolve the promise and return the Base64 image string
                resolve('data:' + blobInfo.blob().type + ';base64,' + base64data);
                updateStatus();
            };

            // Event handler if there's an error reading the file
            reader.onerror = () => {
                reject('Image upload failed due to FileReader error');
            };

            // Read the image as a data URL (Base64)
            reader.readAsDataURL(blobInfo.blob());
        }),
    setup: function read_content(editor) {
        editor.on('keyup', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
            updateStatus();
            }, typingDelay);
        });
    }
});
    
// the page script
const postInfos = document.querySelectorAll(".post-info");
function updateContentFields() {
        // Update TinyMCE content
        if (tinymce.activeEditor) {
            content['html'] = tinymce.activeEditor.getContent({format: 'raw'});
        }
        // Update post-info inputs
        postInfos.forEach(info => {
            content[info.id] = info.value;
        });
}

//get the content from input every time user stop typing
postInfos.forEach(info =>{
    info.addEventListener("input", ()=>{
        clearTimeout(typingTimer) //reset the timer when user typing
        typingTimer = setTimeout(function save_input(){
            updateStatus();
        }, typingDelay);
    })
});

//function to update the status saving
function updateStatus() {
    statusIndicator.classList.add('not-saved');
    setTimeout(() => {
        statusIndicator.classList.remove('not-saved');
        statusIndicator.classList.add('loading');
        void statusIndicator.offsetWidth;
        save_content();
    }, 8000);
}

//function to save the content
function  save_content(){
    return new Promise((resolve, reject) => {
        updateContentFields();
        fetch("/admin/save_content", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(content), 
        }).then(response => response.json()).then(data => {
            statusIndicator.classList.remove('loading')
            if (!data.success){
                statusIndicator.classList.add('not-saved');
                alert(`error saving content: ${data.error}`);
            }else{
                resolve();
            }
        }).catch((error) => {
            statusIndicator.classList.remove('loading')
            alert(`error saving content: ${error}`);
        });
    });
};

const redirect_url = "/admin/page-management" + "?_=" + new Date().getTime();
//function to publish the content
function publish(){
    function info_filled(){
        let status;
        let values = [];
        for (let i = 0; i < postInfos.length; i++) {
            const info = postInfos[i];
            if (info.type === 'text') {
                const value = info.value.trim();
                if (value === "") {
                    return 'not filled';
                }
                else{
                    if (!values.includes(value)) {
                        values.push(value);
                    }
                    else{
                        return 'duplicate';
                    }
                }
            }
        }
    }
    status = info_filled();
    if(status == 'not filled' || tinymce.activeEditor.getContent().trim() === ""){
        alert("Please fill in all the required fields");
        return;
    } else if (status == 'duplicate'){
        alert("Please do not enter duplicate values");
        return;
    }
    if(confirm("Are you sure you want to publish this content?")){
        content["publish"] = true;
        save_content().then(() => {
            alert("Content has been published");
            window.location.href = redirect_url;
        })
    }
}
function back(){
    if (statusIndicator.classList.contains('loading') || statusIndicator.classList.contains('not-saved')){
        if (confirm("Your progress is not saved, Are you sure you want to go back?")) {
            window.location.href = redirect_url;
        } else{
            return;
        }
    }
    window.location.href = redirect_url;
}