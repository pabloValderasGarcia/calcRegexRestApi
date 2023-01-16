window.addEventListener('load', () => {
    const loader = document.querySelector('.loader-container');
    loader.classList.add('loader-hidden');
    let yes = false;
    loader.addEventListener('transitionend', () => {
        if (!yes) {
            yes = true;
            document.body.removeChild(loader);
        }
    })
});