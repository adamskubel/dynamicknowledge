define(function(require,exports,module){

    var BoxView = require('PositioningLayouts/BoxView');

    function ToggleButton(options)
    {
        BoxView.call(this,options);

        this._toggleState = false;
        this._eventOutput.on('click',_flipToggleState.bind(this));
    }

    ToggleButton.prototype = Object.create(BoxView.prototype);
    ToggleButton.prototype.constructor = ToggleButton;

    ToggleButton.DEFAULT_OPTIONS = {
        clickable: true,
        scrollviewSizeHack: false,
        color:3500,
        text:"",
        textAlign:[0.5,0.5],
        fontSize:'small',
        editable:false,
        rendercontrol:false,
        renderWhitespace:false,
        size:[20,20],
        useMarkdown:false,
        style:{
            font:1,
            background:0.5,
            border:1
        }
    };

    module.exports = ToggleButton;

    ToggleButton.prototype.getState = function()
    {
        return this._toggleState;
    };

    ToggleButton.prototype.setState = function(newState)
    {
        if (this._toggleState != newState)
        {
            _updateToggleState.call(this,newState);
        }
    };

    function _flipToggleState()
    {
        this.setState(!this._toggleState);
    }

    function _updateToggleState(newState)
    {
        this._toggleState = newState;

        this.setHighlighted(newState);

        this._eventOutput.emit('stateChanged', {
            sender: this,
            state: !!this._toggleState
        });

        if (newState)
        {
            this._eventOutput.emit('toggleOn', {
                sender: this
            });
        }
        else
        {
            this._eventOutput.emit('toggleOff', {
                sender: this
            });
        }
    }



});