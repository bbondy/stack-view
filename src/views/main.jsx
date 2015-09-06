var React = require('react');

var Answer = React.createClass({
  render: function() {
    return <div>
      <hr/>
      <div dangerouslySetInnerHTML={{ __html: this.props.answer.body}}/>
    </div>;
  }
});

var Main = React.createClass({
  componentDidMount: function() {
  },
  render: function () {
    return <html>
      <head>
        <title>{this.props.title}</title>
     </head>
     <body>
       <h1>{this.props.question.title}</h1>
       <p dangerouslySetInnerHTML={{ __html: this.props.question.body}}/>
       {
         this.props.answers.map((answer) => <Answer key={answer.id} answer={answer} />)
       }
     </body>
   </html>;
  }
});
module.exports = Main;
