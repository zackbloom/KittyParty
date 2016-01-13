(function() {
  var options = INSTALL_OPTIONS;

  var guessDimentions = function(el, src) {
    var computed = getComputedStyle(el);

    var img;
    if (src.indexOf('data:') == 0){
      img = new Image;
      img.src = src;
    }

    var height, width;
    if (img) {
      height = img.height;
    } else if (el.getAttribute('height')) {
      height = parseFloat(el.getAttribute('height'));
    } else if (el.style.height) {
      height = parseFloat(el.style.height);
    } else if (computed.height) {
      height = parseFloat(computed.height);
    }

    if (img) {
      width = img.width;
    } else if (el.getAttribute('width')) {
      width = parseFloat(el.getAttribute('width'));
    } else if (el.style.width) {
      width = parseFloat(el.style.width);
    } else if (computed.width) {
      width = parseFloat(computed.width);
    }

    return {
      height: height,
      width: width
    };
  };

  var current = {cats: 0, dogs: 0};

  optimizeSrc = function(el, src) {
    if (!src)
      src = el.src

    if (/meow-voyage[._]imgix[._]net/.test(src)) {
      return;
    }
    var size = guessDimentions(el, src);

    size.width = size.width || size.height || 400;
    size.height = size.height || size.width;

    if (size.width < 20 || size.height < 20)
      return;

    if (size.width / size.height > 2 && size.height <= 48)
      return;

    size.width |= 0;
    size.height |= 0;

    size.width = Math.min(size.width, 1600);
    size.height = Math.min(size.height, 1600);

    var proto = document.location.protocol;
    if (proto === 'file:') {
      proto = 'http:';
    }

    var animal = options.animal;

    current[animal]++;
    var num = current[animal];
    current[animal] = current[animal] % 15;

    return "//meow-voyage.imgix.net/" + animal + "/" + num + ".jpg?w=" + size.width + "&h=" + size.height + "&fit=min&auto=enhance,format";
  };

  var backgroundRe = /url\(["']?(.+?)["']?\)/;

  var checkBackground = function(addedNode) {
    var style = getComputedStyle(addedNode)

    if (style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage.indexOf('meow-voyage') === -1 && addedNode !== document.body && style.backgroundRepeat !== 'repeat-y'){
      var match = backgroundRe.exec(style.backgroundImage);

      if (match){
        var optimizedSrc = optimizeSrc(addedNode, match[1]);

        if (optimizedSrc && optimizedSrc !== match[1]) {
          addedNode.style.backgroundImage = style.backgroundImage.replace(backgroundRe, 'url("' + optimizedSrc + '")')
        }
      }
    }
  }

  checkNode = function(addedNode) {
    switch (addedNode.nodeType) {
      case 1:
        if (addedNode.tagName == 'IMG') {
          setSrc(addedNode, optimizeSrc(addedNode));

          watch(addedNode, 'src', function(node){
            setSrc(node, optimizeSrc(node));
          });
        } else if (addedNode.tagName == 'VIDEO') {
          var src = '//dleu7peb3ob67.cloudfront.net/videos/' + options.animal + '.mp4';
          addedNode.innerHTML = '<source src="' + src + '" type="video/mp4">';
          addedNode.src = src;
        } else if (addedNode.tagName == 'IFRAME') {
          if (addedNode.src.indexOf("www.youtube.com/embed/") !== -1){
            addedNode.src = 'https://www.youtube.com/embed/tntOCGkgt98';
          }
        } else {
          checkBackground(addedNode);
          watch(addedNode, 'style', checkBackground);
        }
    }
  };

  var setSrc = function(img, src){
    if (!src || src === img.src || img.src.indexOf('meow-voyage') !== -1)
      return;

    img.src = src;
    img.srcset = '';

    if (!img.getAttribute('onload') || img.getAttribute('onload').indexOf('google') === -1){
      // ^ Fix for Google Images
      img.style.visibility = 'hidden';
    }

    var done = function(){
      img.style.visibility = 'visible';

      img.removeEventListener('load', done);
      img.removeEventListener('error', done);
    }

    img.addEventListener('load', done);
    img.addEventListener('error', done);
  }

  var watch = function(node, attr, cb){
    var updating = false;
    var ob = new MutationObserver(function(mutations) {
      if (updating)
        return;

      for (var i=0; i < mutations.length; i++) {
        var mutation = mutations[i];

        if (mutation.attributeName === attr){
          updating = true;
          setTimeout(function(){
            updating = false;
          }, 0);

          cb(node)
        }
      }
    });

    ob.observe(node, {
      attributes: true,
      attributeFilter: [attr]
    });
  }

  var walkChildren = function(node) {
    if (node.nodeType === 1){
      checkNode(node);

      if (node.children && node.children.length){
        for (var i=0; i < node.children.length; i++){
          walkChildren(node.children[i]);
        }
      }
    }
  }

  if (window.MutationObserver != null) {
    observer = new MutationObserver(function(mutations) {
      for (var i=0; i < mutations.length; i++) {
        mutation = mutations[i];

        for (var j=0; j < mutation.addedNodes.length; j++) {
          walkChildren(mutation.addedNodes[j]);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

})();
