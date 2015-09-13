var React = require('react');

var UserPage = React.createClass({
  render: function() {
    return <div className='sectionContainer'>
      { this.props.user.websiteUrl ?
        <a href={this.props.user.websiteUrl}><h1>{this.props.user.displayName}</h1></a> :
        <h1>{this.props.user.displayName}</h1>
      }
      { this.props.user.profileImageUrl ?
      <img src={this.props.user.profileImageUrl}/> : null
      }
      { this.props.user.age ?
      <div><span>Age</span>: {this.props.user.age}</div> : null
      }
      <div dangerouslySetInnerHTML={{ __html: this.props.user.aboutMe}}/>
    </div>;
  }
});

export default UserPage;
