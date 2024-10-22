document.addEventListener('DOMContentLoaded',function () {
    let data;
    
    start();

    async function start(){
        //Get data from json file
        data = await loadData();        

        const comments = data.comments; 

        //Sort comments by score
        comments.sort((a, b) => b.score - a.score);               
    
        renderComments(); 

        //Render form to add new comment
        formAddComment(data.currentUser);        
    }
    
    function renderComments(){
        const comments = data.comments;
        const commentsList = document.querySelector('#comments-list');
            
        //Clear comment list
        while(commentsList.firstChild){
            commentsList.removeChild(commentsList.firstChild);
        }        

        comments.forEach(comment => {
            //Get comment content
            const commentContent = createCommentContetn(comment);

            //Get comment replies container
            const commentRepliesContainer = commentContent.querySelector('[data-container="comment-replies"]');

            //Add replies to comment
            if(comment.replies.length>0){
                comment.replies.forEach(reply => {
                    commentRepliesContainer.appendChild(createCommentContetn(reply,'reply',comment));
                });
            }else{
                //Remove replies container if comment  don´t have replies
                commentRepliesContainer.remove();
            }            

            //Add comment to list
            commentsList.appendChild(commentContent);
        });
    }

    function createCommentContetn(comment, commentType = 'comment',originalComment = null){
        //Get comment template
        const commentTemplate = document.querySelector('#commentTemplate');

        //Clone comment template
        const commentClone = commentTemplate.content.cloneNode(true);
        
        //Create comment container
        const commentContent = document.createElement('LI');
        commentContent.classList.add('flex','flex-col');   
        const container = commentClone.querySelector('[data-container="comment-container"]');

        //Get comment data
        const username = comment.user.username;
        const userAvatar = comment.user.image;
        
        //Add margin left if and remove reply container if comment is a reply
        if(commentType==='reply'){            
            commentContent.classList.add('ml-4','md:ml-7');
            commentClone.querySelector('[data-container="comment-replies"]').remove();
            //Add the user to whom you reply in comment text
            commentClone.querySelector('[data-container="comment-text"]').innerHTML = 
                `<a class="text-blue-700 font-semibold" href="#">@${comment.replyingTo}</a> ${comment.content}`;
        }else{
            //Add comment text only
            commentClone.querySelector('[data-container="comment-text"]').textContent = comment.content;
        }
        //Add username and avatar
        commentClone.querySelector('[data-container="user-avatar"]').appendChild(createUserAvatar(userAvatar,username));        
        commentClone.querySelector('[data-container="username"]').textContent = username;        

        const comentScore =  commentClone.querySelector('[data-container="score"]');            
        const scoreContainer = commentClone.querySelector('[data-container="score-container"]');
        
        const btnScoreUp = commentClone.querySelector('[data-container="score-up"]');
        const btnScoreDown = commentClone.querySelector('[data-container="score-down"]');
        
        //Vote up
        btnScoreUp.addEventListener('click',function(){
            voteUp(comment,btnScoreUp,btnScoreDown,scoreContainer);
            renderScore(comentScore,comment)
        })

        //Vote down        
        btnScoreDown.addEventListener('click',function(){   
            voteDown(comment,btnScoreDown,btnScoreUp,scoreContainer);  
            renderScore(comentScore,comment)
        })

        renderScore(comentScore,comment)  

        if(comment.vote==='up'){
            changeClass(btnScoreUp,'text-blue-600','text-blue-300');
            changeClass(scoreContainer,'bg-blue-200','bg-blue-50');
            disableButton(btnScoreDown,'red');
        }        
        if(comment.vote==='down'){            
            changeClass(btnScoreDown,'text-red-600','text-blue-300');
            changeClass(scoreContainer,'bg-red-100','bg-blue-50');
            disableButton(btnScoreUp,'blue');
        }

        //Set create date
        commentClone.querySelector('[data-container="created-at"]').textContent = diffForHumans(new Date(comment.createdAt));

        //Reply the comment
        const replyButton = commentClone.querySelector('[data-container="reply-button"]');
        replyButton.addEventListener('click',function (){                        
            if(!container.querySelector('[data-container="reply-form-container"]')){
                //If comment is a reply to other comemnt new reply add to orginal comment reply lisit
                if(commentType==='reply'){                
                    container.appendChild(createReplyForm(comment,originalComment));  
                }else{
                    container.appendChild(createReplyForm(comment));  
                } 
            }                       
        })            
        
        //Own comment 
        if(username === 'juliusomo'){
            commentClone.querySelector('small').textContent = 'you';

            const actionContainer = document.createElement('DIV');
            actionContainer.classList.add('flex','gap-4','absolute','bottom-4','right-3','md:right-[20px]','md:top-[25px]','h-fit');                
            
            const svgIconDelte = '<svg width="12" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M1.167 12.448c0 .854.7 1.552 1.555 1.552h6.222c.856 0 1.556-.698 1.556-1.552V3.5H1.167v8.948Zm10.5-11.281H8.75L7.773 0h-3.88l-.976 1.167H0v1.166h11.667V1.167Z" fill="currentColor"/></svg>';
            const deleteButton = createButton('Delete','red',svgIconDelte);
            deleteButton.addEventListener('click',function (e){                
                e.preventDefault();   
                showDeleteModal(comment.id,commentType);            
            });

            const svgIconEdit = '<svg width="14" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M13.479 2.872 11.08.474a1.75 1.75 0 0 0-2.327-.06L.879 8.287a1.75 1.75 0 0 0-.5 1.06l-.375 3.648a.875.875 0 0 0 .875.954h.078l3.65-.333c.399-.04.773-.216 1.058-.499l7.875-7.875a1.68 1.68 0 0 0-.061-2.371Zm-2.975 2.923L8.159 3.449 9.865 1.7l2.389 2.39-1.75 1.706Z" fill="currentColor"/></svg>';
            const editButton = createButton('Edit','blue',svgIconEdit);
            const commentTextContainer = commentClone.querySelector('[data-container="comment-text-container"]');
            editButton.addEventListener('click',function(e){
                e.preventDefault();
                showEditForm(comment,commentTextContainer,comment.content,deleteButton,editButton);
            })

            actionContainer.appendChild(deleteButton);
            actionContainer.appendChild(editButton);
                                
            //Add actions container to comment container
            container.appendChild(actionContainer)   

            //If is own comment remove reply button   
            replyButton.remove();
        }else{
            replyButton.dataset.id = comment.id;  
        }       
        
        commentContent.appendChild(commentClone);

        return commentContent;
    }

    function createUserAvatar(userAvatar, username) {
        const picture = document.createElement('PICTURE');

        const sourceWebp = document.createElement('SOURCE');
        sourceWebp.srcset = userAvatar.webp;
        sourceWebp.type = 'image/webp';
    
        const sourcePng = document.createElement('SOURCE');
        sourcePng.srcet = userAvatar.png;
        sourcePng.type = 'image/png';
    
        const img = document.createElement('IMG');
        img.loading = "lazy";
        img.classList.add('min-w-8', 'h-8');
        img.alt = `${username}'s avatar`;
        img.src = userAvatar.png;
    
        picture.appendChild(sourceWebp);
        picture.appendChild(sourcePng);
        picture.appendChild(img);
    
        return picture;
    }
    


    function voteUp(comment,btnScoreUp,btnScoreDown,container){        
        if(comment.vote === 'no'){            
            comment.score++;                   
            comment.vote = 'up';  
            changeClass(btnScoreUp,'text-blue-600','text-blue-300');
            container.classList.remove('bg-blue-50');
            container.classList.add('bg-blue-200');
            disableButton(btnScoreDown,'red');
        }else if(comment.vote === 'up'){
            comment.score =comment.score-1;                   
            comment.vote = 'no';  
            changeClass(btnScoreUp,'text-blue-300','text-blue-600');
            container.classList.add('bg-blue-50');
            container.classList.remove('bg-blue-200');
            enableButton(btnScoreDown,'red');
        }        
        saveData(); 
    }

    function voteDown(comment,btnScoreDown,btnScoreUp,container){
        if(comment.vote === 'no'){            
            comment.score =comment.score-1;                   
            comment.vote = 'down';  
            changeClass(btnScoreDown,'text-red-600','text-blue-300');
            container.classList.remove('bg-blue-50');
            container.classList.add('bg-red-100');       
            disableButton(btnScoreUp,'blue'); 
        }else if(comment.vote === 'down'){
            comment.score =comment.score+1;  
            comment.vote = 'no';  
            changeClass(btnScoreDown,'text-blue-300','text-red-600');
            container.classList.add('bg-blue-50');
            container.classList.remove('bg-red-100');
            enableButton(btnScoreUp,'blue');
        }    
        saveData();   
    }

    function renderScore(commentScore,comment){
        commentScore.textContent = comment.score;
        changeClass(commentScore,'text-blue-700','text-red-500');
        if(comment.score < 0){
            changeClass(commentScore,'text-red-500','text-blue-700');
        }
    }

    function changeClass(content,addColor, removeColor){
        content.classList.add(addColor);
        content.classList.remove(removeColor);  
    }

    function disableButton(button,color){
        button.classList.remove('hover:text-'+color+'-600')   
        button.classList.remove('cursor-pointer')   
        button.classList.add('cursor-default')  
        button.disabled = true; 
    }

    function enableButton(button,color){
        button.classList.add('hover:text-'+color+'-600')   
        button.classList.add('cursor-pointer')   
        button.classList.remove('cursor-default')   
        button.disabled = false; 
    }

    function createButton(text,color,icon){
        const button = document.createElement('BUTTON');
        button.classList.add('h-fit','flex','gap-1','items-center',`text-${color}-600`,`hover:text-${color}-200`,'transition-colors','font-semibold');
        button.innerHTML = icon+`<span class="font-rubik ">${text}</span>`;        

        return button;
    }

    function showEditForm(comment,container,text,deleteButton,editButton){        
        //Hide original text        
        container.querySelector('[data-container="comment-text"]').classList.add('hidden');

        //Hidde actions buttons
        deleteButton.classList.remove('text-red-600');
        deleteButton.classList.add('text-red-200');
        deleteButton.disabled = true;
        editButton.classList.remove('text-blue-600');
        editButton.classList.add('text-blue-200');
        editButton.disabled = true;

        const form = document.createElement('FORM');
        form.classList.add('flex','flex-col','w-ful','items-end','gap-4');

        const textArea = document.createElement('TEXTAREA');
        textArea.classList.add('w-full','border','border-blue-200','rounded-md','h-20','resize-none','cursor-pointer','outline-none','focus:border-blue-700','p-4','py-2','text-gray-700','font-rubik')
        textArea.textContent = text;

        const btnUpdate = document.createElement('INPUT');
        btnUpdate.classList.add('flex','uppercase','h-fit','w-fit','bg-blue-700','p-2','px-5','rounded-lg','font-semibold','text-white','cursor-pointer','hover:bg-blue-200','transition-colors','font-rubik');
        btnUpdate.type = 'submit';
        btnUpdate.value = 'update';
        
        form.addEventListener('submit',function (e){
            e.preventDefault();
            comment.content = textArea.value;
            renderComments();
        })

        form.appendChild(textArea);
        form.appendChild(btnUpdate);
        container.appendChild(form);
    }

    function showDeleteModal(id,commentType){
        const body = document.querySelector('body');

        //Create modal
        const modal = document.createElement('DIV')
        modal.classList.add('bg-black','bg-opacity-70','fixed','h-full','w-full','top-0','left-0','z-10','flex','flex-col','justify-center','items-center','p-3');

        const modalContent = document.createElement('DIV');
        modalContent.classList.add('bg-white','max-w-[370px]','p-5','md:p-7','rounded-md','md:rounded-lg');
        
        const modalTitle = document.createElement('H1');
        modalTitle.classList.add('text-2xl','font-semibold','text-gray-700');
        modalTitle.textContent = 'Delete comment';

        const modalText = document.createElement('P');
        modalText.classList.add('text-gray-700','leading-5','mt-4','font-rubik');
        modalText.textContent = "Are you sure you want to delete this comment? This will remove the comment and can't be undone";

        const actionsContainer = document.createElement('DIV');
        actionsContainer.classList.add('flex','mt-4','gap-2');

        const buttonCancel = document.createElement('BUTTON');
        buttonCancel.classList.add('bg-gray-500','hover:bg-gray-400','transition-colors','p-2','rounded-md','uppercase','text-white','font-rubik','w-full');
        buttonCancel.textContent = 'No, cancel';

        buttonCancel.addEventListener('click', function (e) {
            e.preventDefault();
            modal.remove();
        })

        const buttonDelete = document.createElement('BUTTON');
        buttonDelete.classList.add('bg-red-400','hover:bg-red-300','transition-colors','p-2','rounded-md','uppercase','text-white','font-rubik','w-full');
        buttonDelete.textContent = 'Yes, delete';
        
        buttonDelete.addEventListener('click', function(e){
            e.preventDefault();
            deleteComment(id,commentType);
            modal.remove();
        })
        
        actionsContainer.appendChild(buttonCancel);
        actionsContainer.appendChild(buttonDelete);

        modalContent.appendChild(modalTitle);
        modalContent.appendChild(modalText);
        modalContent.appendChild(actionsContainer);
        
        modal.appendChild(modalContent)
        body.appendChild(modal);
    }

    function deleteComment(id,commentType='comment'){
        if(commentType==='reply'){
            data.comments.forEach(comment => {

                // Find Reply index
                const replyIndex = comment.replies.findIndex(reply => reply.id === id);                        

                // Delete reply 
                if (replyIndex !== -1) {                            
                    comment.replies.splice(replyIndex, 1);
                }
            });
        }else{                
            const comments = data.comments;                     
            
            //Find comment index
            const commentIndex = comments.findIndex(comment => comment.id === id);

            // Delete Comment
            if (commentIndex !== -1) {                            
                data.comments.splice(commentIndex, 1);
            }               
        }    
        saveData();        
        renderComments();
    }

    function createReplyForm(comment,originalComment = null){        
        const replyContainer = document.createElement('DIV');
        replyContainer.classList.add('bg-white','rounded','md:rounded-lg','shadow-sm','p-3','md:p-5','relative');
        replyContainer.dataset.container = 'reply-form-container'

        const replyForm = document.createElement('FORM');
        replyForm.classList.add('flex','flex-col-reverse','md:flex-row','gap-4');
        
        const a = document.createElement('A');
        a.href = '#';        
        a.appendChild(createUserAvatar(data.currentUser.image,data.currentUser.username));

        const textArea = document.createElement('TEXTAREA');
        textArea.classList.add('w-full','border','border-blue-200','rounded-md','h-20','resize-none','cursor-pointer','outline-none','focus:border-blue-700','p-4','py-2','text-gray-700');
        textArea.name = 'comment';

        const buttonSubmit = document.createElement('INPUT');
        buttonSubmit.classList.add('uppercase','absolute','right-3','bottom-3','md:static','flex','h-fit','bg-blue-700','p-2','px-5','rounded-lg','font-semibold','text-white','cursor-pointer','hover:bg-blue-200','transition-colors')
        buttonSubmit.type = 'submit';
        buttonSubmit.value = 'reply';

        replyForm.addEventListener('submit',function (e){
            e.preventDefault();            
            if(textArea.value.length>0){
                if(originalComment!==null){
                    addReply(textArea.value,comment,originalComment);
                }else{
                    console.log('comment');
                    addReply(textArea.value,comment);
                }
                renderComments();
            }else{
                replyContainer.remove();
            }           
            
        });

        replyForm.appendChild(a);
        replyForm.appendChild(textArea);
        replyForm.appendChild(buttonSubmit);
        replyContainer.appendChild(replyForm);
        return replyContainer;
    }

    function formAddComment(dataCurrentUser){
        //Get user data
        const username = dataCurrentUser.username;
        const userAvatar = dataCurrentUser.image;

        const newCommentForm = document.querySelector('#add-new-comment-form');
        const formNewComment = newCommentForm.querySelector('form');
        const textArea = formNewComment.querySelector('textarea');
        
        //Load user avatar
        newCommentForm.querySelector('#current-user-avatar').appendChild(createUserAvatar(userAvatar,username));

        formNewComment.addEventListener('submit',function(e){
            e.preventDefault();            
            if(textArea.value.length>0){
                addComment(textArea.value);
                textArea.value = '';
            }
        });       
    }

    function addComment(commentText){
        const newComment = {
            id : getLastId()+1,
            content : commentText,
            createdAt : getCurrentDate(),
            replies : [],
            score : 0,
            user : {
                image: {
                    "png": "./src/images/avatars/image-juliusomo.png",
                    "webp": "./src/images/avatars/image-juliusomo.webp"
                },
                username : "juliusomo"
            },
            vote : 'no'
        };

        //Add comment to comment list
        data.comments.push(newComment);
        
        saveData();

        renderComments();
    }

    function addReply(commentText,replyingToComment,originalComment=null){
        
        const newComment = {            
            id : getLastId()+1,
            content : commentText,
            createdAt : getCurrentDate(),
            replyingTo : replyingToComment.user.username,
            score : 0,
            user : {
                image: {
                    "png": "./src/images/avatars/image-juliusomo.png",
                    "webp": "./src/images/avatars/image-juliusomo.webp"
                },
                username : "juliusomo"
            },
            vote : 'no'
        };        
      
        if(originalComment!==null){
            originalComment.replies.push(newComment);
            
        }else{
            replyingToComment.replies.push(newComment);
        }
        
        saveData();
    }

    function getLastId(){
        let allIds = [];
        
        data.comments.forEach(comment => {
            allIds.push(comment.id);
    
            if (comment.replies.length > 0) {
                comment.replies.forEach(reply => {
                    allIds.push(reply.id);
                });
            }
        });
    
        return Math.max(...allIds);
    }

    function getCurrentDate() {
        const currenDate = new Date();
        
        const year = currenDate.getFullYear();
        const month = String(currenDate.getMonth() + 1).padStart(2, '0');
        const day = String(currenDate.getDate()).padStart(2, '0');
        const hour = String(currenDate.getHours()).padStart(2, '0');
        const minute = String(currenDate.getMinutes()).padStart(2, '0');
        const second = String(currenDate.getSeconds()).padStart(2, '0');
    
        const formatedDate = `${year}-${month}-${day}T${hour}:${minute}:${second}`;       

        return formatedDate;
    }

    function diffForHumans(fecha) {
        const now = new Date();
        const diff = now - fecha; 
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
      
        if (weeks > 0) {
          return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else if (days > 0) {
          return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
          return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
          return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
          return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
        }
    }

    function saveData(){
        //Save data un local storage
        localStorage.setItem('data', JSON.stringify(data));
    }

    async function loadData(){
        // Load data from store data
        const storedData = JSON.parse(localStorage.getItem('data'));

        // If there is no data on local storage load from json file
        if (storedData) {
            return storedData;
        } else {
            // Load from original json file
            return await getDataFromJson();
        }
    }    

    async function getDataFromJson(){
        try {
            const response = await fetch('./data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load comments.');
        }
    }
})