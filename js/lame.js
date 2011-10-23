(function($) {
	
    // creating namespace.
    var theSheepsSays = theSheepsSays || {};
    
    theSheepsSays.LAMe = {
        //
        // Default setttings.
        settings: {
            //
            // Gets or sets an indication wether or not to
            // display debugging information.
            verbose: true,
            //
            // Store all css class names used.
            classNames: {
                // the class name for each queue.
                queue: 'lame-queue',
                // the class name for each queue header.
			    queueHeader: 'lame-queue-header',
                // the class name for each queue list content.
                queueContent: 'lame-queue-content',
                // the class for each card.
                card: 'lame-card',
                // the class name for each card header.
			    cardHeader: 'lame-card-header',
                // the class name for each card content.
			    cardContent: 'lame-card-content',
                // the class name for a active card, ie. when it being moved.
			    cardActive: 'lame-card-active',
                // the class name for a card
			    cardPlaceholder: 'lame-card-placeholder'
            },
            //
            // default template.
            cardTemplate: {
                id: undefined,
                name: 'Card Template',
                desc: '',
                color: 'red'
            },
            queueTemplate: {
                id: undefined,
                name: 'Queue Template',
                visible: true,
                max: -1
            },
            //
            // Stores the names of all css classes color names.
            colors: [
                'lame-red', 'lame-blue', 'lame-green'
            ],
            //
            // Occur when a card is added.
            add: function(obj, type) { },
            //
            // Occur when a card is removed.
            remove: function(obj, type) { return true; },
            //
            // Occur when a card is changed.
            change: function(card, to, from) { return true; },
            //
            // Occur when load from html and parsing the element to an object..
            fromHtml: function(type, settings) {
                if (type == 'card')
                    return $.fn.lame.cardFromHtml.apply(this, [settings, this]);
                else if (type == 'queue')
                    return $.fn.lame.queueFromHtml.apply(this, [settings, this]);

                return null;
            },
            //
            // Occur when translating an object to html.
            toHtml: function(obj, type, settings) {
                if (type == 'card')
                    return $.fn.lame.cardToHtml(obj, settings);
                else if (type == 'queue')
                    return $.fn.lame.queueToHtml(obj, settings);

                return null;
            }
        },
        //
        // data model.
        dataModel: { queue: [ ], card: [ ] },
        //
        // initializing a new instane of the .
        init: function(settings) {

            var ns = theSheepsSays.LAMe;
            ns.settings = $.extend({}, ns.settings, settings);

            var dm = ns.dataModel;
            var cn = ns.settings.classNames;

            $(this).find('.' + cn.queue).each(function() {
                var q = ns.settings.fromHtml.apply(this, ['queue', ns.settings]);
                
                if (q != null)
                    dm.queue.push(q);

                $(this).find('.' + cn.card).each(function() {
                    var c = ns.settings.fromHtml.apply(this, ['card', ns.settings]);

                    if (c != null)
                        dm.card.push(c);
                });
            });

            sortlist(ns.settings);

            debug('data model', dm);
            debug('initialized...', ns.settings);
            return this;
        },
        //
        // gets or sets cards. 
        card: function(card) {
            
            var ns = theSheepsSays.LAMe;
            var dm = ns.dataModel.card;
            var verbose = ns.settings.verbose;

            if (card == null) {
                debug('card object is null, return all cards.', dm, verbose);
                return dm;
            }
            else if (card.id == null) {
                debug('card has no id attribute, therefore treats it an id.', card, verbose);
                return findById(card, dm);
            }

            var exist = findById(card.id, dm);

            if (exist == null)
            {
                card = $.extend({}, 
                    ns.settings.cardTemplate, 
                    card
                );
                dm.push(card);
                
                debug('adding new card, merged with template.', card, verbose);
                $('.lame-queue ul:first').append(
                    ns.settings.toHtml(card, 'card', ns.settings)
                );
                ns.settings.add(exist, 'card');
            }
            else {
                exist = $.extend(exist, exist, card);
                
                debug('updating card. ', exist, verbose);
                ns.settings.change(exist, 'card');
            }

            return exist == null ? card : exist;
        },
        //
        // adds a new queue to the end of the queue stack.
        queue: function(queue) {

            var ns = theSheepsSays.LAMe; // namespace.
            var dm = ns.dataModel.queue; // datamodel.
            var verbose = ns.settings.verbose; // verbose debugging.

            if (queue == null) {
                debug('queue object is null, returning all queues.', dm, verbose);
                return queue;
            }
            else if (queue.id == null) {
                debug('queue has no id attribute, therefore treats it an id.', queue, verbose);
                return findById(queue, dm);
            }

            var exist = findById(queue.id, dm);

            if (exist == null) {
                queue = $.extend({},
                    ns.settings.queueTemplate, 
                    queue
                );
                dm.push(queue);
                
                debug('adding new queue', queue, verbose);
                ns.settings.add(queue, 'queue');
            }
            else {
                exist = $.extend(exist, queue);
                
                debug('updating existing queue', queue, verbose);
                ns.settings.change(exist, 'queue');
            }

            return exist == null ? queue : exist;
        },
        //
        // removes a card or a queue from datamodel.
        remove: function(obj) {

            var ns = theSheepsSays.LAMe;

            if (obj == null) {
                debug('object is null, nothing we can remove.');
                return;
            }

            var id = obj.id == null ? obj : obj.id;
            var index = findIndexById(id, ns.dataModel.card);

            if (index >= 0) {
                var dm = ns.dataModel.card;
                var card = dm[index];
                dm = dm.splice(index, 1);

                if (ns.settings.remove(card, 'card') == true) {
                    $('#' + card.id).remove();
                    debug('Remove card from datamodel', card); 
                }

                return card;
            }

            index = findIndexById(id, ns.dataModel.queue);

            if (index >= 0) {
                var dm = ns.dataModel.queue;
                var queue = dm[index];
                dm = dm.splice(index, 1);                
                
                if (ns.settings.remove(queue, 'queue') == true) {
                    var elm = $('#' + queue.id);
                    elm.find('.' + ns.settings.classNames.card).each(function () {
                        ns.remove($(this).attr('id'));
                    });
                    elm.remove();              
                    debug('Remove queue from datamodel', queue);
                }
                return queue;
            }

            debug('was unable to locate any card or queue with the specific id "' + id + '".');    
        },
        options: function(settings) {
            
            var ns = theSheepsSays.LAMe;

            if (settings != null)
                ns.settings = $.extend({}, ns.settings, settings);
            
            return ns.settings;
        }
    };

    $.fn.lame = function(method) {

        var ns = theSheepsSays.LAMe;

        if ( ns[method] ) {
            return ns[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return ns.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist in theSheepsSays.LAMe.' );
        }  

    };

    $.fn.lame.queueFromHtml = function(settings) {
        var cn = settings.classNames; 
        var queue = { 
	        id: $(this).attr('id'), 
			name: $(this).find('.' + cn.queueHeader).text(),
			visible: $(this).is(':visible'),
	    };
        return $.extend({}, settings.queueTemplate, queue);
    };

    $.fn.lame.cardFromHtml = function(settings) {
        var cn = settings.classNames;
        var card = {
            id: $(this).attr('id'),
            name: $(this).find('.' + cn.cardHeader).text(),
            desc: $(this).find('.' + cn.cardContent).text(),
            color: getColorIndex(this)
        };
        return $.extend({}, settings.cardTemplate, card);

        function getColorIndex(elm) {
            for (var i in settings.colors)
                if ($(elm).hasClass(settings.colors[i]))
                    return i;

            return -1;
        }
    };

    $.fn.lame.queueToHtml = function(queue, settings) {
        var cn = settings.classNames;
        
        var html ='<div id="' + queue.id + '" class="' + cn.queue + '">';
		    html += '<div class="' + cn.queueHeader + '">' + queue.name + '</div>';
            html += '<ul class="' + cn.queueContent + '">';
		    html += '</ul></div>';
		
		return $(html);
    };

    $.fn.lame.cardToHtml = function(card, settings) {
        var cn = settings.classNames,
            colors = settings.colors;
		
		var html = '<li id="' + card.id +'" class="' + cn.card + ' ' + colors[card.color] + '">';
			html += '<div class="' + cn.cardHeader + '">' + card.name + '</div>';
			html += '<div class="' + cn.cardContent + '">' + card.desc + '</div>';
			html += '</li>';
		
		return $(html);
    };

    function sortlist(settings) {
        var cn = settings.classNames;
        
        // setup sortable list.
		var content = $('.' + cn.queueContent);
		content.sortable({
		    connectWith: content,
			placeholder: cn.cardPlaceholder,
			scroll: false,
			revert: true,
			remove: function(event, ui) {
                // reference to the datamodel.
                var dm = theSheepsSays.LAMe.dataModel;
                
				var prevId = findColumnAt(ui.originalPosition, '.' + cn.queue).attr('id');
				var nextId = $(ui.item).parent().parent().attr('id');
				var cardId = $(ui.item).attr('id');
					
				var next = findById(nextId, dm.queue);
				var prev = findById(prevId, dm.queue);
				var card = findById(cardId, prev.items);
					
                debug('Moved card: ' + cardId + ' from queue: ' +
                    prevId + ' to queue: ' + nextId + '.');
			    settings.change(card, next, prev);
		    }
        }).disableSelection();
    }

	function findById(id, array) {
		
		for(var i in array) {
			var obj = array[i];
			if (obj.id === undefined)
				continue;
			else if (obj.id == id)
				return obj;
		}
		
		return null;
	}

    function findIndexById(id, array) {

        for (var i in array) {
            var obj = array[i];
            if (obj.id == null)
                continue;
            else if (obj.id == id)
                return parseInt(i, 10);
        }

        return -1;
    }
	
	function findColumnAt(pos, selector) {
		var columns = [];
		
		$(selector).each(function() {
			columns.push({ left: $(this).position().left, item: this });
		});
		
		for (var i = 0; i < (columns.length - 1); i++) {
			if (pos.left >= columns[i].left && pos.left <= columns[i+1].left)
				return $(columns[i].item);			
		}
		
		return $(columns[columns.length -1].item);
	}
	
	function debug(message, obj, verbose) {

        if (verbose == null)
            verbose = true;

		if (verbose && window.console && window.console.log) {
            var msg = 'message: ' + message;

            if (obj != null)
                msg += ' objects: ';

            window.console.log(msg);

            if (obj != null) 
                window.console.log(obj);
        }
	}
		
})(jQuery);
