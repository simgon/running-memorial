import { Controller } from '@hotwired/stimulus'

// Connects to data-controller="created_session"
export default class extends Controller {
  connect(event) {
    location.reload();
  }
}
