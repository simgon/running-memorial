import { Controller } from '@hotwired/stimulus'

// Connects to data-controller="created_user"
export default class extends Controller {
  connect(event) {
    location.reload();
  }
}
