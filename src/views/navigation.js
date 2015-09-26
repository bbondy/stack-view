var React = require('react');

export var Button = React.createClass({
  render: function() {
    return <div>
      <a href={this.props.href}><span className='button'>{this.props.text}</span></a>
    </div>;
  }
});

export var BackButton = React.createClass({
  render: function() {
    return <Button text="Back" href={this.props.href} />;
  }
});

export var NextButton = React.createClass({
  render: function() {
    return <Button text="Next" href={this.props.href} />;
  }
});
